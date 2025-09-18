import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ExternalApiService } from './external-api.service';

@Controller('external-api')
export class ExternalApiController {
  constructor(private readonly externalApiService: ExternalApiService) {}

  // POST /external-api/upload-image
  // Accepts multipart/form-data with field name "image"
  // @Post('test')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        if (file.mimetype?.startsWith('image/')) return cb(null, true);
        cb(
          new BadRequestException('Invalid file type. Only images are allowed'),
          false,
        );
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { name: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Expect field "image"');
    }
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException(
        'Invalid file type. Only images are allowed',
      );
    }
    // Upload image to Gemini to get a file URI
    const uploaded = await this.externalApiService.uploadImageToGemini({
      buffer: file.buffer,
      mimeType: file.mimetype,
    });
    if (!uploaded.uri || !uploaded.mimeType) {
      throw new BadRequestException('Failed to upload image to Gemini');
    }

    const result = await this.externalApiService.geminiExtractFoodData(
      body.name,
      {
        uri: uploaded.uri,
        mimeType: uploaded.mimeType,
      },
      undefined,
    );
    return result;
  }
}
