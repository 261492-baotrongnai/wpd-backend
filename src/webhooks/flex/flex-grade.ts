import { messagingApi } from '@line/bot-sdk';

export const GradeAFlex = (menu_name: string): messagingApi.FlexMessage => {
  return {
    type: 'flex',
    altText: 'Grade A',
    contents: {
      type: 'bubble',
      size: 'mega',
      hero: {
        type: 'image',
        url: 'https://i.postimg.cc/G3Kjr3QK/grade-A.png',
        aspectRatio: '2:1',
        aspectMode: 'fit',
        size: 'full',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: menu_name,
                size: 'lg',
                wrap: true,
                weight: 'bold',
                align: 'center',
              },
            ],
            paddingBottom: 'sm',
          },
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'คะแนนสุขภาพ : A',
                offsetTop: 'xs',
                weight: 'bold',
                margin: 'md',
              },
              {
                type: 'text',
                text: ' ดีมากค่ะ รักษาแบบนี้ไว้นะคะ สุขภาพดีเริ่มจากจานนี้เลยค่ะ',
                wrap: true,
                offsetStart: 'none',
                offsetTop: 'md',
              },
              {
                type: 'text',
                margin: 'xxl',
                weight: 'bold',
                contents: [
                  {
                    type: 'span',
                    text: 'ข้อแนะนำ : ',
                  },
                  {
                    type: 'span',
                    text: 'ถ้าเติมผักในมื้อนี้ จะดีต่อสุขภาพมากขึ้นค่ะ',
                    weight: 'regular',
                  },
                ],
                wrap: true,
                offsetTop: 'none',
                offsetBottom: 'none',
              },
            ],
            paddingTop: 'md',
            paddingBottom: 'md',
            paddingStart: 'md',
            paddingAll: 'none',
            paddingEnd: 'md',
          },
        ],
        paddingBottom: 'xxl',
        paddingTop: 'xxl',
        paddingAll: 'lg',
      },
    },
  };
};

export const GradeBFlex = (menu_name: string): messagingApi.FlexMessage => {
  return {
    type: 'flex',
    altText: 'Grade B',
    contents: {
      type: 'bubble',
      size: 'mega',
      hero: {
        type: 'image',
        url: 'https://i.postimg.cc/5ys5mp0T/grade-B.png',
        aspectRatio: '2:1',
        aspectMode: 'fit',
        size: 'full',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: menu_name,
                size: 'lg',
                wrap: true,
                weight: 'bold',
                align: 'center',
              },
            ],
            paddingBottom: 'sm',
          },
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'คะแนนสุขภาพ : B',
                offsetTop: 'xs',
                weight: 'bold',
                margin: 'md',
              },
              {
                type: 'text',
                text: ' มื้อนี้ยังพอไหวค่ะ ถ้าเบาลงได้นิดหน่อยจะดีมากเลยนะคะ',
                wrap: true,
                offsetStart: 'none',
                offsetTop: 'md',
              },
              {
                type: 'text',
                margin: 'xxl',
                weight: 'bold',
                contents: [
                  {
                    type: 'span',
                    text: 'ข้อแนะนำ : ',
                  },
                  {
                    type: 'span',
                    text: 'ถ้าเติมผักในมื้อนี้ จะดีต่อสุขภาพมากขึ้นค่ะ',
                    weight: 'regular',
                  },
                ],
                wrap: true,
                offsetTop: 'none',
                offsetBottom: 'none',
              },
            ],
            paddingTop: 'md',
            paddingBottom: 'md',
            paddingStart: 'md',
            paddingAll: 'none',
            paddingEnd: 'md',
          },
        ],
        paddingBottom: 'xxl',
        paddingTop: 'xxl',
        paddingAll: 'lg',
      },
    },
  };
};

export const GradeCFlex = (menu_name: string): messagingApi.FlexMessage => {
  return {
    type: 'flex',
    altText: 'Grade C',
    contents: {
      type: 'bubble',
      size: 'mega',
      hero: {
        type: 'image',
        url: 'https://i.postimg.cc/sxj9SbV5/grade-C.png',
        aspectRatio: '2:1',
        aspectMode: 'fit',
        size: 'full',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: menu_name,
                size: 'lg',
                wrap: true,
                weight: 'bold',
                align: 'center',
              },
            ],
            paddingBottom: 'sm',
          },
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'คะแนนสุขภาพ : C',
                offsetTop: 'xs',
                weight: 'bold',
                margin: 'md',
              },
              {
                type: 'text',
                text: ' มื้อนี้มะลิอยากให้เลี่ยงเลยนะคะ เพื่อสุขภาพที่ดีในระยะยาวค่ะ',
                wrap: true,
                offsetStart: 'none',
                offsetTop: 'md',
              },
              {
                type: 'text',
                margin: 'xxl',
                weight: 'bold',
                contents: [
                  {
                    type: 'span',
                    text: 'ข้อแนะนำ : ',
                  },
                  {
                    type: 'span',
                    text: 'ถ้าเติมผักในมื้อนี้ จะดีต่อสุขภาพมากขึ้นค่ะ',
                    weight: 'regular',
                  },
                ],
                wrap: true,
                offsetTop: 'none',
                offsetBottom: 'none',
              },
            ],
            paddingTop: 'md',
            paddingBottom: 'md',
            paddingStart: 'md',
            paddingAll: 'none',
            paddingEnd: 'md',
          },
        ],
        paddingBottom: 'xxl',
        paddingTop: 'xxl',
        paddingAll: 'lg',
      },
    },
  };
};

const GradeInfo = {
  A: {
    message: 'มื้อนี้ดีมากค่ะ รักษาแบบนี้ไว้นะคะ สุขภาพดีเริ่มจากจานนี้เลยค่ะ',
    imageUrl: 'https://i.postimg.cc/G3Kjr3QK/grade-A.png',
    suggest_preset: 'ถ้าเติมผักในมื้อนี้ จะดีต่อสุขภาพมากขึ้นค่ะ',
    bgColor: '#059F3B',
  },
  B: {
    message: 'มื้อนี้ยังพอไหวค่ะ ถ้าเบาลงได้นิดหน่อยจะดีมากเลยนะคะ',
    imageUrl: 'https://i.postimg.cc/5ys5mp0T/grade-B.png',
    suggest_preset: 'ถ้าเติมผักในมื้อนี้ จะดีต่อสุขภาพมากขึ้นค่ะ',
    bgColor: '#BC971E',
  },
  C: {
    message: 'มื้อนี้มะลิอยากให้เลี่ยงเลยนะคะ เพื่อสุขภาพที่ดีในระยะยาวค่ะ',
    imageUrl: 'https://i.postimg.cc/sxj9SbV5/grade-C.png',
    suggest_preset: 'ถ้าเติมผักในมื้อนี้ จะดีต่อสุขภาพมากขึ้นค่ะ',
    bgColor: '#D83829',
  },
};

export const GradeFlex = (
  grade: 'A' | 'B' | 'C',
  menu_name: string,
  ai_grading_menus?: string[],
  suggestion?: string,
): messagingApi.FlexMessage => {
  const { message, imageUrl, bgColor } = GradeInfo[grade];
  return {
    type: 'flex',
    altText: `มื้อนี้ของคุณได้ Grade ${grade}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      hero: {
        type: 'image',
        url: imageUrl,
        aspectRatio: '2:1',
        aspectMode: 'fit',
        size: 'full',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: menu_name,
                size: 'xl',
                wrap: true,
                weight: 'bold',
                align: 'center',
                scaling: true,
              },
            ],
            paddingBottom: 'sm',
          },
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'คะแนนสุขภาพ : ' + grade,
                offsetTop: 'xs',
                weight: 'bold',
                margin: 'md',
                scaling: true,
                wrap: true,
                color: bgColor,
                size: 'lg',
              },
              {
                type: 'text',
                text: message,
                wrap: true,
                offsetStart: 'none',
                offsetTop: 'lg',
                scaling: true,
                size: 'md',
              },
              {
                type: 'text',
                margin: 'xxl',
                weight: 'bold',
                contents: [
                  {
                    type: 'span',
                    text: 'ข้อแนะนำ : ',
                  },
                  {
                    type: 'span',
                    text: suggestion || GradeInfo[grade].suggest_preset,
                    weight: 'regular',
                  },
                ],
                wrap: true,
                offsetTop: 'md',
                offsetBottom: 'none',
                scaling: true,
              },
            ],
            paddingTop: 'md',
            paddingBottom: 'md',
            paddingStart: 'md',
            paddingAll: 'none',
            paddingEnd: 'md',
          },
        ],
        paddingBottom: 'xxl',
        paddingTop: 'xxl',
        paddingAll: 'none',
        paddingStart: 'lg',
        paddingEnd: 'lg',
        position: 'relative',
        ...((ai_grading_menus?.length ?? 0) > 0
          ? { offsetBottom: 'none' }
          : {}),
      },
      ...((ai_grading_menus ?? []).length > 0
        ? { footer: AIWarningFooter(ai_grading_menus ?? []) }
        : {}),
    },
  };
};

export const AIWarningFooter = (menus: string[]): messagingApi.FlexBox => {
  return {
    type: 'box',
    layout: 'vertical',
    contents: [
      {
        type: 'separator',
        margin: 'none',
      },
      {
        type: 'text',
        text: `⚠️ ข้อมูลของ ${menus.join(', ')} เป็นการประเมินเกรดจาก AI อาจจะมีความคลาดเคลื่อนไปบ้างค่ะ`,
        margin: 'md',
        size: 'sm',
        scaling: true,
        wrap: true,
        align: 'start',
        offsetTop: 'sm',
      },
    ],
    paddingStart: 'lg',
    paddingEnd: 'lg',
    paddingTop: 'none',
    paddingBottom: 'xxl',
  };
};
