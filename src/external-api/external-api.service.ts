import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { lang } from 'moment-timezone';
import { FoodGradeType } from 'src/food-grades/entities/food-grade.entity';

@Injectable()
export class ExternalApiService implements OnModuleInit {
  private readonly logger = new Logger(ExternalApiService.name);
  private gemini: any;
  private createPartFromUri: any;
  private createUserContent: any;
  private Type: any;
  cooking_method_enum = [
    'ทอด',
    'ต้ม',
    'นึ่ง',
    'ย่าง',
    'ลวก',
    'ดิบ',
    'ผัด',
    'ยำ',
    'ชุปแป้งทอด',
    'อบ',
    'ตุ๋น',
    'หมัก',
    'ปิ้ง',
  ] as const;

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

  async uploadImageToGemini(content: { buffer: Buffer; mimeType: string }) {
    try {
      const image: { uri: string; mimeType: string; name: string } =
        (await this.gemini.files.upload({
          file: new Blob([new Uint8Array(content.buffer)]),
          config: {
            mimeType: content.mimeType,
          },
        })) as { uri: string; mimeType: string; name: string };
      this.logger.log('Uploaded Image to gemini name:', image.name);
      return image;
    } catch (error) {
      this.logger.error('Error uploading image to Gemini:', error);
      throw error;
    }
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

  async geminiExtractFoodData(
    user_menu_name: string,
    content?: { uri: string; mimeType: string },
    geminiImageName?: string,
  ) {
    try {
      let uri: string;
      let mimeType: string;
      if (content) {
        uri = content.uri;
        mimeType = content.mimeType;
      } else if (geminiImageName) {
        const file = await this.gemini.files.get({
          name: geminiImageName,
        });
        if (file.uri && file.mimeType) {
          uri = file.uri;
          mimeType = file.mimeType;
        } else {
          throw new Error('Image not found in Gemini files');
        }
      } else {
        throw new Error('Either content or geminiImageName must be provided');
      }
      console.log('Extracting food data for menu:', user_menu_name);
      console.log('Using image content:', content);
      const response = await this.gemini.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          this.createUserContent([
            `แยกข้อมูลอาหารสำหรับเมนู: ${user_menu_name} จากรูปนี้ โดยใช้ภาษาไทย`,
            this.createPartFromUri(uri, mimeType),
          ]),
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: this.Type.OBJECT,
            required: ['foodData', 'reason_description'],
            properties: {
              foodData: {
                type: this.Type.OBJECT,
                required: [
                  'cooking_method',
                  'ingredients',
                  'there_is_vegetable',
                  'there_is_grain',
                  'there_is_meat',
                  'there_is_rice',
                  'there_is_noodle',
                  'there_is_fruit',
                  'there_is_sweet',
                  'there_is_drink',
                  'there_is_snack',
                  'there_is_sauce',
                  'sauces',
                  'grains',
                  'rices',
                  'noodles',
                  'fruits',
                  'drinks',
                ],
                properties: {
                  cooking_method: {
                    type: this.Type.ARRAY,
                    items: {
                      type: this.Type.STRING,
                      enum: this.cooking_method_enum,
                    },
                    minItems: 1,
                    description:
                      'วิธีการประกอบอาหาร (cooking_method) ต้องมีอย่างน้อย 1 วิธี',
                  },
                  ingredients: {
                    type: this.Type.ARRAY,
                    items: {
                      type: this.Type.STRING,
                    },
                    minItems: 1,
                  },
                  there_is_vegetable: { type: this.Type.BOOLEAN },
                  there_is_grain: { type: this.Type.BOOLEAN },
                  grains: {
                    type: this.Type.ARRAY,
                    items: {
                      type: this.Type.STRING,
                      enum: [
                        'ข้าวสาลี',
                        'ข้าวโพด',
                        'ข้าวบาร์เลย์',
                        'ข้าวโอ๊ต',
                        'ควินัว',
                        'ถั่วต่างๆ',
                        'อื่นๆ',
                      ],
                    },
                    description:
                      'ระบุชนิดของธัญพืช หากไม่มีธัญพืชให้เว้นว่างไว้',
                  },
                  there_is_meat: { type: this.Type.BOOLEAN },
                  there_is_rice: { type: this.Type.BOOLEAN },
                  rices: {
                    type: this.Type.ARRAY,
                    items: {
                      type: this.Type.STRING,
                      enum: [
                        'ข้าวขาว',
                        'ข้าวกล้อง',
                        'ข้าวไรซ์เบอร์รี่',
                        'ข้าวเหนียว',
                        'ข้าวมันปู',
                        'อื่นๆ',
                      ],
                    },
                    description: 'ระบุชนิดของข้าว หากไม่มีข้าวให้เว้นว่างไว้',
                  },
                  there_is_noodle: { type: this.Type.BOOLEAN },
                  noodles: {
                    type: this.Type.ARRAY,
                    items: {
                      type: this.Type.STRING,
                      enum: [
                        'เส้นหมี่ขาว',
                        'บะหมี่ไข่',
                        'วุ้นเส้น',
                        'ก๋วยเตี๋ยวเส้นเล็ก',
                        'ก๋วยเตี๋ยวเส้นใหญ่',
                        'อุด้ง',
                        'ขนมจีน',
                        'เส้นบุก',
                        'บะหมี่หยก',
                        'เส้นบุก',
                        'สปาเกตตี',
                        'พาสต้า',
                        'ราเมน',
                        'มาม่า',
                        'มักกะโรนี',
                        'อื่นๆ',
                      ],
                    },
                    description:
                      'ระบุชนิดของเส้นก๋วยเตี๋ยวหรือบะหมี่ หากไม่มีเส้นในเมนูให้เว้นว่างไว้',
                  },
                  there_is_fruit: { type: this.Type.BOOLEAN },
                  fruits: {
                    type: this.Type.ARRAY,
                    items: {
                      type: this.Type.STRING,
                    },
                    description: 'ระบุชนิดของผลไม้ หากไม่มีผลไม้ให้เว้นว่างไว้',
                  },
                  there_is_sweet: { type: this.Type.BOOLEAN },
                  there_is_drink: { type: this.Type.BOOLEAN },
                  drinks: {
                    type: this.Type.ARRAY,
                    items: {
                      type: this.Type.STRING,
                      enum: [
                        'น้ำเปล่า',
                        'น้ำผลไม้',
                        'น้ำอัดลม',
                        'ชา',
                        'กาแฟ',
                        'นม',
                        'แอลกอฮอล์',
                        'อื่นๆ',
                      ],
                    },
                    description:
                      'ระบุชนิดของเครื่องดื่ม หากไม่มีเครื่องดื่มให้เว้นว่างไว้',
                  },
                  there_is_snack: { type: this.Type.BOOLEAN },
                  there_is_sauce: { type: this.Type.BOOLEAN },
                  sauces: {
                    type: this.Type.ARRAY,
                    items: {
                      type: this.Type.STRING,
                      enum: [
                        'พริกน้ำปลา',
                        'ซีอิ๊ว',
                        'ซอสมะเขือเทศ',
                        'มายองเนส',
                        'น้ำจิ้มไก่',
                        'น้ำจิ้มซีฟู้ด',
                        'น้ำจิ้มสุกี้',
                        'น้ำจิ้มแจ่ว',
                        'น้ำปลา',
                        'ซอสหอยนางรม',
                        'ซอสปรุงรส',
                        'น้ำส้มสายชู',
                        'น้ำมันงา',
                        'น้ำมันพืช',
                        'น้ำมันมะกอก',
                        'น้ำจิ้มบ๊วย',
                        'น้ำจิ้มเต้าเจี้ยว',
                        'น้ำจิ้มถั่ว',
                        'น้ำจิ้มเปรี้ยวหวาน',
                        'น้ำจิ้มหมาล่า',
                        'ซอสพริกศรีราชา',
                        'ซอสเทอริยากิ',
                        'ซอสบาร์บีคิว',
                        'ซอสโหระพา',
                        'ซอสพอนสึ',
                        'ซอสทาโกะยากิ',
                        'ซอสยากิโทริ',
                        'ซอสครีมสลัด',
                        'น้ำสลัดครีม',
                        'น้ำสลัดซอสงา',
                      ],
                    },
                    description:
                      'ระบุชนิดของน้ำจิ้มหรือซอส หากไม่มีน้ำจิ้ม/ซอสให้เว้นว่างไว้',
                  },
                },
              },
              reason_description: {
                type: this.Type.STRING,
              },
            },
          },
        },
      });

      console.log('Gemini response:', response.text);

      if (!response || !response.text) {
        this.logger.error('Response from Gemini is empty:', response);
        throw new Error('Response from Gemini is empty');
      }

      const parsed = JSON.parse(response.text);

      const foodData = {
        name: user_menu_name,
        cooking_method: parsed.foodData.cooking_method,
        ingredients: parsed.foodData.ingredients,
        reason_description: parsed.reason_description,
        there_is_vegetable: parsed.foodData.there_is_vegetable,
        there_is_meat: parsed.foodData.there_is_meat,
        there_is_rice: parsed.foodData.there_is_rice,
        there_is_noodle: parsed.foodData.there_is_noodle,
        there_is_fruit: parsed.foodData.there_is_fruit,
        there_is_sweet: parsed.foodData.there_is_sweet,
        there_is_drink: parsed.foodData.there_is_drink,
        there_is_snack: parsed.foodData.there_is_snack,
        there_is_grain: parsed.foodData.there_is_grain,
        there_is_sauce: parsed.foodData.there_is_sauce,
        sauces: parsed.foodData.sauces || [],
        grains: parsed.foodData.grains || [],
        rices: parsed.foodData.rices || [],
        noodles: parsed.foodData.noodles || [],
        fruits: parsed.foodData.fruits || [],
        drinks: parsed.foodData.drinks || [],
      };

      return foodData;
    } catch (error) {
      this.logger.error('Error at [geminiExtractFoodData]:', error);
      throw new Error('An unexpected error occurred in geminiExtractFoodData');
    }
  }
}
