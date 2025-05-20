import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('meal_image')
  getMealsImageUrsl(
    @Request() req: { user: { id: number } },
    @Query('file_name') file_name: string,
  ) {
    console.log('file_name:', file_name);
    const key = `meal_images/${req.user.id}/${file_name}`;
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
