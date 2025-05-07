import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get('meal_image')
  getMealsImageUrsl(@Req() req: Request) {
    const file_name = req.query.file_name as string;
    console.log('file_name:', file_name);
    const key = `meal_images/${file_name}`;
    const response = this.imagesService.getSignedUrl(key);
    return response;
  }

  @Post('meals/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMealsImage(@UploadedFile() file: Express.Multer.File) {
    console.log('Received file:', file);
    const response = await this.imagesService.uploadFile(file, 'meal_images/');
    return response;
  }

  @Post()
  async create(@Body() createImageDto: CreateImageDto) {
    return this.imagesService.create(createImageDto);
  }

  @Get()
  findAll() {
    return this.imagesService.findAll();
  }

  // @Get(':id')
  // async findOne(@Param('id') id: string) {
  //   return this.imagesService.findOne(+id);
  // }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateImageDto: UpdateImageDto) {
    return this.imagesService.update(+id, updateImageDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.imagesService.remove(+id);
  }
}
