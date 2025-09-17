import * as line from '@line/bot-sdk';
export const CommonUserFlex: line.messagingApi.FlexMessage = {
  type: 'flex',
  altText: 'ตั้งค่าให้เป็นผู้ใช้ทั่วไป',
  contents: {
    type: 'bubble',
    size: 'giga',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: ' มะลิตั้งค่าให้เป็น “ผู้ใช้งานทั่วไป” แล้วค่ะ👍🏻',
          size: '18px',
          wrap: true,
          margin: 'sm',
        },
        {
          type: 'text',
          text: ' มะลิพร้อมช่วยดูแลในทุกมื้อของคุณนะคะ💗⭐️',
          size: '18px',
          wrap: true,
          margin: 'sm',
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
          url: 'https://i.postimg.cc/SxN8Zr9J/image.avif',
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
