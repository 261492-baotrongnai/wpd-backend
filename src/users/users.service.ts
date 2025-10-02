import {
  Body,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
// import { UpdateUserDto } from './dto/update-user.dto';
import { getInternalId, verifyIdToken } from './user-utility';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import * as line from '@line/bot-sdk';
import { RegistConfirmFlex } from './user-flex';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Program } from 'src/programs/entities/programs.entity';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { Follower } from 'src/followers/entities/followers.entity';

@Injectable()
export class UsersService {
  private readonly client: line.messagingApi.MessagingApiClient;
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectQueue('program') private readonly programQueue: Queue,

    @InjectQueue('follower') private readonly followerQueue: Queue,

    private readonly entityManager: EntityManager,
    private readonly jwtService: JwtService,
    private readonly queueEventsRegistryService: QueueEventsRegistryService,
  ) {
    const config = {
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    };
    this.client = new line.messagingApi.MessagingApiClient(config);
  }

  async generateToken(internalId: string): Promise<string> {
    const secretKey = process.env.JWT_SECRET;
    return await this.jwtService.signAsync(
      { internalId, role: 'user' },
      { secret: secretKey, expiresIn: '1h' },
    );
  }

  async decodeToken(
    token: string,
  ): Promise<{ internalId: string; role: string }> {
    const secretKey = process.env.JWT_SECRET;
    return await this.jwtService.verifyAsync<{
      internalId: string;
      role: string;
    }>(token, { secret: secretKey });
  }

  async verifyLineIDToken(idToken: string) {
    try {
      await verifyIdToken(idToken);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error verifying ID token: ${error.message}`);
      }
      return false;
    }
  }

  async getLineProfile(
    userId: string,
  ): Promise<line.messagingApi.UserProfileResponse | null> {
    try {
      this.logger.debug(`Fetching LINE profile for userId: ${userId}`);
      const profile = await this.client.getProfile(userId);
      this.logger.debug(`Fetched LINE profile: ${JSON.stringify(profile)}`);
      return profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error fetching LINE profile: ${message}`, error);
      return null;
    }
  }

  async getUserWithLineProfile(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new Error('User not found');
    }
    if (!user.userId) {
      return { user, profile: null };
    }
    const profile = await this.getLineProfile(user.userId);
    return { user, profile };
  }

  async create(@Body() registerDto: RegisterDto) {
    try {
      this.logger.log('Creating user with ID token:', registerDto);
      const iid = await getInternalId(registerDto.idToken, undefined);
      const uid = this.jwtService.decode<{ sub: string }>(registerDto.idToken);

      // Check if user already exists
      const user = await this.usersRepository.findOne({
        where: { internalId: iid },
        relations: ['programs'],
      });

      // Check if program code is exists
      const job = await this.programQueue.add('find-program-by-code', {
        code: registerDto.program_code,
      });
      const program: Program | null =
        (await this.queueEventsRegistryService.waitForJobResult(
          job,
          this.programQueue,
        )) as Program | null;
      this.logger.debug(`Program found: ${JSON.stringify(program)}`);

      if (user) {
        const acct = await this.generateToken(user.internalId);

        user.programs.push(program as Program);
        user.userId = uid?.sub; // Set userId from decoded token
        await this.entityManager.save(user);
        this.logger.log(
          `User with internalId: ${user.internalId} already exists, added to program`,
        );

        return { type: 'User', access_token: acct };
      }

      let newUser: User;
      if (program) {
        newUser = new User({
          internalId: iid,
          programs: [program],
          userId: uid?.sub, // Set userId from decoded token
        });
      } else {
        newUser = new User({
          internalId: iid,
        });
      }

      const new_user_created = await this.usersRepository.save(newUser);

      this.logger.log(
        `New user created with internalId: ${newUser.internalId}`,
      );
      if (!new_user_created) {
        throw new InternalServerErrorException('Failed to create user');
      }

      const acct = await this.generateToken(newUser.internalId);

      const followerJob = await this.followerQueue.add('create-follower', {
        userId: uid?.sub,
      });
      const followerResult: unknown =
        await this.queueEventsRegistryService.waitForJobResult(
          followerJob,
          this.followerQueue,
        );
      this.logger.debug(
        `Follower job result: ${JSON.stringify(followerResult)}`,
      );
      return { type: 'NewUser', access_token: acct };
    } catch (error) {
      console.error('Error creating user:', error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
    }
  }

  async findAll() {
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.images', 'image')
      .leftJoinAndSelect('user.states', 'userState')
      .getMany();

    return users;
  }

  async findUserByInternalId(internalId: string) {
    const user = await this.usersRepository.findOne({
      where: { internalId },
      relations: ['programs', 'states'],
    });

    return user;
  }

  async findUserById(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    return user;
  }

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user with data: ${JSON.stringify(updateUserDto)}`;
  // }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async handleRegisterSuccess(userId: string) {
    try {
      await this.client.pushMessage({
        to: userId,
        messages: [RegistConfirmFlex],
      });
      this.logger.log('Registration success message sent successfully');
    } catch (error) {
      this.logger.error('Error handling registration success:', error);
      throw error;
    }
  }

  async updateUserStreaks(streaks: number, id: number): Promise<User> {
    // If streak resets to 0 we keep previous streak value in carryStreak
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['achievements'],
    });
    if (!user) return Promise.reject(new Error('User not found'));
    let new_user = user;
    // If streak resets to 0
    // get biggest achievement threshold of user's achievements
    // and set carryStreak to that if it's bigger than current carryStreak
    if (streaks === 0 && user.achievements.length > 0) {
      const maxStreak = Math.max(
        ...user.achievements.map((a) =>
          a.streakThereshold > 1 ? a.streakThereshold : 0,
        ),
      );
      this.logger.debug(`Max streak from achievements: ${maxStreak}`);

      const carryStreak = user.carryStreak || 0;
      if (maxStreak > carryStreak) {
        await this.usersRepository.update(id, {
          streaks,
          carryStreak: maxStreak,
        });
        new_user = (await this.usersRepository.findOne({
          where: { id },
        })) as User;
        this.logger.log(
          `User ${id} streaks reset to 0, carryStreak updated to ${new_user?.carryStreak}`,
          new_user,
        );
        return new_user;
      }
    }
    await this.usersRepository.update(id, { streaks });
    new_user = (await this.usersRepository.findOne({
      where: { id },
    })) as User;
    this.logger.log(`User ${id} streaks updated to ${streaks}`);
    this.logger.debug(`Update result: ${JSON.stringify(new_user)}`);
    return new_user;
  }

  async updateUserTotalDays(totalDays: number, id: number) {
    await this.usersRepository.update(id, { totalDays });
  }

  async addUserPoints(add_points: number, id: number) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error(`User not found: ${id}`);
    }
    const newPoints = (user.points || 0) + add_points;
    await this.usersRepository.update(id, { points: newPoints });
  }

  async getTodayEmptyMealUsers(): Promise<
    { id: number; lineUserId: string; streaks: number }[]
  > {
    const followers = await this.entityManager.getRepository(Follower).find();
    const today = new Date();
    const results: { id: number; lineUserId: string; streaks: number }[] = [];
    this.logger.log(`Checking results ${JSON.stringify(results)}`);

    for (const follower of followers) {
      const internalId = await getInternalId(undefined, follower.userId);
      const user = await this.usersRepository.findOne({
        where: { internalId },
        relations: ['meals'],
      });
      if (!user) continue;

      const hasMealToday = user.meals.some((meal) => {
        const mealDate = new Date(meal.createdAt);
        return (
          mealDate.getFullYear() === today.getFullYear() &&
          mealDate.getMonth() === today.getMonth() &&
          mealDate.getDate() === today.getDate()
        );
      });

      if (hasMealToday) {
        this.logger.log(`User ${user.id} has meal today: ${hasMealToday}`);
        continue;
      }

      this.logger.log(`User ${user.id} has no meals today`);
      results.push({
        id: user.id,
        lineUserId: follower.userId,
        streaks: user.streaks,
      });
    }

    this.logger.log(
      `Found ${results.length} followers whose linked users have no meals today`,
    );
    return results;
  }

  async updateCurrentFrame(userId: number, frameId: number) {
    this.logger.log(
      `Updating current frame to ${frameId} for user ID: ${userId}`,
    );
    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
      relations: ['storeItems', 'currentFrame'],
    });
    if (!user) {
      throw new Error('User not found');
    }

    if (frameId === 0) {
      // Clear current frame
      user.currentFrame = null;
      await this.entityManager.save(user);
      return { message: 'Current frame cleared' };
    }

    const frame = user.storeItems.find(
      (item) => item.id === frameId && item.category === 'frame',
    );
    if (!frame) {
      throw new Error('Frame not owned or does not exist');
    }

    user.currentFrame = frame;
    await this.entityManager.save(user);
    return { message: 'Current frame updated', currentFrame: frame };
  }

  async getCurrentFrameImageName(userId: number) {
    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
      relations: ['currentFrame'],
    });
    const imageName = user?.currentFrame?.imageName || null;
    this.logger.log(
      `Current frame image for user ID ${userId}: ${imageName || 'None'}`,
    );
    return imageName;
  }
}
