import {
  createPartFromUri,
  createUserContent,
  GoogleGenAI,
  Type,
} from '@google/genai';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ExternalApiService {
  private readonly logger = new Logger(ExternalApiService.name);
  private readonly gemini = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  constructor() {}

  async askMenuName(filePath: string) {
    const image = await this.gemini.files.upload({
      file: filePath,
    });
    if (!image.uri || !image.mimeType) {
      this.logger.error('Image upload failed:', image);
      throw new Error('Image upload failed');
    }
    const response = await this.gemini.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        createUserContent([
          'บอกชื่อเมนูอาหารที่มีในภาพนี้ มา 4 ชื่อ เรียงตามความมั่นใจว่าจะแม่นยำที่สุด',
          createPartFromUri(image.uri, image.mimeType),
        ]),
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
              },
            },
            propertyOrdering: ['name'],
          },
        },
      },
    });
    if (!response || !response.text) {
      this.logger.error('Response from Gemini is empty:', response);
      throw new Error('Response from Gemini is empty');
    }

    // Parse the response and map it to the desired format
    const parsedResponse = JSON.parse(response.text) as { name: string }[];
    return parsedResponse;
  }
}
