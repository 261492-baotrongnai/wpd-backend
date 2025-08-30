import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { FoodGradeType } from 'src/food-grades/entities/food-grade.entity';

@Injectable()
export class ExternalApiService implements OnModuleInit {
  private readonly logger = new Logger(ExternalApiService.name);
  private gemini: any;
  private createPartFromUri: any;
  private createUserContent: any;
  private Type: any;

  constructor() {}

  async onModuleInit() {
    const genaiModule = await import('@google/genai');
    this.gemini = new genaiModule.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    this.createPartFromUri = genaiModule.createPartFromUri;
    this.createUserContent = genaiModule.createUserContent;
    this.Type = genaiModule.Type;
  }

  async getMenuCandidates(
    filePath?: string,
    content?: { buffer: Buffer; mimeType: string },
  ) {
    try {
      if (!filePath && !content) {
        throw new Error('Either filePath or buffer must be provided');
      }
      let image: { uri?: string; mimeType?: string; name?: string } = {};
      if (filePath) {
        // Determine mimeType
        image = await this.gemini.files.upload({
          file: filePath,
          config: {
            mimeType: 'image/jpeg',
          },
        });
      } else if (content) {
        image = await this.gemini.files.upload({
          // fix here
          file: new Blob([new Uint8Array(content.buffer)]),
          config: {
            mimeType: content.mimeType,
          },
        });
      }
      this.logger.log('Uploaded Image to gemini name:', image.name);
      if (!image.uri || !image.mimeType) {
        this.logger.error('Image upload failed:', image);
        throw new Error('Image upload failed');
      }
      const response = await this.geminiRequestMenus(image);
      response.geminiImageName = image.name;
      return response;
    } catch (error) {
      this.logger.error('Error in askMenuName:', error);
      throw error;
    }
  }

  async geminiRequestMenus(uploadedImage: { uri?: string; mimeType?: string }) {
    try {
      if (!uploadedImage.uri || !uploadedImage.mimeType) {
        this.logger.error('Image upload failed:', uploadedImage);
        throw new Error('Image upload failed');
      }

      const response = await this.gemini.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          this.createUserContent([
            'บอกเมนูรายการอาหารที่มีในภาพนี้มาให้ครบถ้วนทุกองค์ประกอบของเมนู เป็นภาษาไทย ไม่ควรเป็นชื่อที่ความหมายกว้างเกินไป ควรเป็นชื่อที่บ่งบอกถึงวัตถุดิบในนั้นได้ด้วยจะดีมาก',
            'หากมีหลายเมนูในภาพ ให้ตอบมาแบบบอกชื่อให้ครบตามจำนวนของเมนูที่เห็นในภาพ เช่น หากในรูปมี 3 อย่าง ให้ตอบ name: /[ส้มตำ,ไก่ย่าง,ข้าวเหนียว/] หากมี 1 อย่างให้ตอบ name: /[ส้มตำ/] ดังนั้น สมาชิกใน array name จึงมักจะไม่ใช่ชื่ออาหารชนิดใกล้เคียงกัน (ทุกสมาชิกใน array name ต้องมีขนาดรวมกันไม่เกิน 40 characters)` )',
            'นอกจากได้ array name มา 1 คำตอบแล้ว ให้เพิ่มตัวเลือก array name ที่มั่นใจรองลงมาอีก 3 ตัวเลือก ในลักษณะเดียวกันแต่ห้ามซ้ำกับคำตอบอื่นๆ ก็จะได้ลักษณะของ response เช่น [{name: ["น้ำพริก"], name: ["น้ำพริกอ่อง","ผักลวก"], name: [คำตอบที่ 2], name: [คำตอบที่ 3]}]',
            '(หากรูปภาพไม่ใช่รูปอาหารที่คนกินจริงๆเข่น รูปวาดอาหาร หรือภาพที่ไม่ใช่อาหาร ให้ตอบ isFood: false)',
            this.createPartFromUri(uploadedImage.uri, uploadedImage.mimeType),
          ]),
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: this.Type.OBJECT,
            properties: {
              isFood: {
                type: this.Type.BOOLEAN,
                description: 'Is the image food?',
              },
              candidates: {
                type: this.Type.ARRAY,
                minItems: '4',
                items: {
                  type: this.Type.OBJECT,
                  properties: {
                    name: {
                      type: this.Type.ARRAY,
                      minItems: '1',
                      items: {
                        type: this.Type.STRING,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      this.logger.debug(
        'Token usage:',
        // response.usageMetadata?.totalTokenCount,
        response,
      );

      if (!response || !response.text) {
        this.logger.error('Response from Gemini is empty:', response);
        throw new Error('Response from Gemini is empty');
      }

      return JSON.parse(response.text) as {
        isFood: boolean;
        candidates: { name: string[] }[];
        geminiImageName: string | undefined;
      };
    } catch (error) {
      this.logger.error('Error at [geminiRequestMenusFromBuffer]:', error);
      throw error;
    }
  }

  async geminiRequestGrade(
    menu: string,
    topBestMatch?: Array<{ name: string; grade: string }>,
    geminiImageName?,
  ): Promise<{ answer: FoodGradeType; descp: string } | null> {
    if (topBestMatch) {
      this.logger.debug('Top best match:', topBestMatch);
    }
    try {
      const contentParts: string[] = [
        `บอกเกรดอาหารของเมนูชื่อ "${menu}"`,
        `โดยที่ประเมินเกรดตามเกณฑ์ "จัดหมวดหมู่อาหารที่กลุ่มเสี่ยงเบาหวาน(ไม่ใช่ผู้ป่วยเบาหวาน)ควรเลือกบริโภคตามกลุ่มค่ามวลน้ำตาล ค่านี้เป็นค่าที่ได้มาจากการคำนวณค่าดัชนีน้ำตาล (Glycemic Index: GI) ร่วมกับปริมาณอาหารที่รับประทานในแต่ละครั้ง เกรด A คือ ค่ามวลน้ำตาลต่ำกว่า 10 เกรด B คือ ค่ามวลน้ำตาล 11-19 เกรด C คือ ค่ามวลน้ำตาลตั้งแต่ 20ขึ้นไป`,
        `ให้ประเมินค่ามวลน้ำตาลจากชื่อเมนูอาหารที่ให้มาข้อมูลเฉลี่ยโดยทั่วไปของอาหารประเภทนั้นๆก่อน สามารถอ้างอิงจากข้อมูลในเว็บไซต์หรือแหล่งข้อมูลอื่นที่เชื่อถือได้`,
        `จากนั้นนำค่าน้ำตาลที่ได้มาจัดเกรดตามเกณฑ์ที่กำหนด`,
        `หาก "${menu}" ไม่ใช่ชื่ออาหารที่มีอยู่จริงในฐานข้อมูลอาหาร ให้ response กลับมาเป็น null`,
      ];

      if (topBestMatch) {
        contentParts.push(
          `และนี่คือข้อมูลอาหารที่มีdatabase ซึ่งมีความคล้ายคลึงกับเมนูที่ให้มามากที่สุด แต่ไม่ถึง 80% ${JSON.stringify(
            topBestMatch,
          )} ถสามารถอ้างอิงได้`,
        );
      }

      if (geminiImageName) {
        const file = await this.gemini.files.get({
          name: geminiImageName,
        });
        if (file.uri && file.mimeType) {
          contentParts.push(`ให้ดูในรูปประกอบ เพื่อป้องกันการสับสนจากชื่อเมนู`);
          contentParts.push(this.createPartFromUri(file.uri, file.mimeType));
        }
      }

      const response = await this.gemini.models.generateContent({
        model: 'gemini-2.0-flash',
        // merged here
        contents: [this.createUserContent(contentParts)],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: this.Type.OBJECT,
            properties: {
              answer: {
                type: this.Type.STRING,
                enum: ['A', 'B', 'C'],
              },
              descp: {
                type: this.Type.STRING,
                description: 'Description of the grade',
              },
            },
          },
        },
      });

      if (response.text?.includes('null') || response.text === null) {
        this.logger.debug('Response from Gemini is null');
        return null;
      }

      if (!response || !response.text) {
        throw new Error('Response from Gemini is empty');
      }
      this.logger.debug(
        'Response grading from Gemini:',
        response.usageMetadata?.totalTokenCount,
      );
      return JSON.parse(response.text) as {
        answer: FoodGradeType;
        descp: string;
      };
    } catch (error) {
      this.logger.error('Error at [geminiRequestGrade]:', error);
      throw new Error('An unexpected error occurred in geminiRequestGrade');
    }
  }
}
