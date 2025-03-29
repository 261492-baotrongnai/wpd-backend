import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { EntityManager, Repository } from 'typeorm';
import { Image } from './entities/image.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Image)
    private readonly imagesRepository: Repository<Image>,
    private readonly entityManager: EntityManager,
  ) {}
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
