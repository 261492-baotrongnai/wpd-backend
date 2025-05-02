import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { EntityManager, Repository } from 'typeorm';
import { Image } from './entities/image.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { createS3Client } from './spaceUtil';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class ImagesService {
  private readonly s3Client = createS3Client();

  constructor(
    @InjectRepository(Image)
    private readonly imagesRepository: Repository<Image>,
    private readonly entityManager: EntityManager,
  ) {}

  async getSignedUrl(key: string): Promise<{ signed_url: string }> {
    const bucketName = process.env.SPACE_NAME;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    // Create a pre-signed URL that expires in 24 hour
    const signed_url = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600 * 24,
    });

    return { signed_url };
  }

  async create(createImageDto: CreateImageDto) {
    const image = new Image(createImageDto);
    await this.entityManager.save(image);
  }

  findAll() {
    return this.imagesRepository.find();
  }

  async findOne(id: number) {
    return this.imagesRepository.findOneBy({ id });
  }

  async update(id: number, updateImageDto: UpdateImageDto) {
    const image = await this.imagesRepository.findOneBy({ id });
    if (image && updateImageDto.name) {
      image.name = updateImageDto.name;
      await this.entityManager.save(image);
      return image;
    } else {
      throw new NotFoundException('Image not found or name is undefined');
    }
  }

  async remove(id: number) {
    if (!(await this.imagesRepository.findOneBy({ id }))) {
      throw new NotFoundException('Image not found');
    } else await this.imagesRepository.delete({ id });
    return { message: `Image with id ${id} has been deleted` };
  }
}
