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
