import * as line from '@line/bot-sdk';
export const OutOfCaseFlex: line.messagingApi.FlexMessage = {
  type: 'flex',
  altText:
    'เรื่องนี้เกินขอบเขตที่มะลิดูแลอยู่ค่ะ มะลิเลยตอบไม่ได้ ต้องขออภัยด้วยนะคะ🙇🏻‍♀️',
  contents: {
    type: 'bubble',
    size: 'mega',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: 'เรื่องนี้เกินขอบเขตที่มะลิดูแลอยู่ค่ะ มะลิเลยตอบไม่ได้ ต้องขออภัยด้วยนะคะ🙇🏻‍♀️',
          margin: 'sm',
          size: 'md',
          scaling: true,
          wrap: true,
          offsetBottom: 'none',
          offsetTop: 'none',
        },
      ],
      paddingBottom: 'xl',
      paddingTop: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'image',
          url: 'https://i.postimg.cc/CdT77Jqz/temp-Image-Zf-SIKl.avif',
          size: 'full',
          aspectRatio: '2:1',
          aspectMode: 'cover',
          offsetTop: 'none',
          margin: 'sm',
        },
      ],
      offsetTop: 'none',
      paddingAll: 'none',
    },
  },
};
