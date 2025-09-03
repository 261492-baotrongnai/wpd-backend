import { messagingApi } from '@line/bot-sdk';

export const FlexInProgress: messagingApi.FlexMessage = {
  type: 'flex',
  altText: 'กำลังอยู่ระหว่างการพัฒนา',
  contents: {
    type: 'bubble',
    size: 'giga',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          size: 'md',
          wrap: true,
          //   scaling: true,
          margin: 'sm',
          contents: [
            {
              type: 'span',
              text: ' ขออภัยในความไม่สะดวกค่ะ',
              weight: 'bold',
              size: 'md',
            },
            {
              type: 'span',
              text: ' ส่วนนี้กำลังพัฒนาอยู่ หากเสร็จแล้วมะลิจะแจ้งเตือนให้ทราบค่ะ',
              size: 'md',
            },
          ],
        },
      ],
      paddingTop: 'xl',
      paddingBottom: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'image',
          url: 'https://i.postimg.cc/0jZjVfSR/image.png',
          size: 'full',
          aspectRatio: '2:1',
          aspectMode: 'cover',
          offsetTop: 'none',
        },
      ],
      offsetTop: 'none',
      paddingAll: 'none',
    },
  },
};
