import { messagingApi } from '@line/bot-sdk';

export const RegistConfirmFlex: messagingApi.FlexMessage = {
  type: 'flex',
  altText: 'บันทึกผู้ใช้งานสำเร็จ',
  contents: {
    type: 'bubble',
    size: 'giga',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: 'มะลิบันทึกประเภทผู้ใช้งานเรียบร้อยค่ะ✅ ',
          wrap: true,
          margin: 'none',
        },
        {
          type: 'text',
          text: 'กดที่เมนูด้านล่างเพื่อเริ่มการใช้งานได้เลยนะคะ⬇️',
          wrap: true,
          margin: 'md',
          offsetBottom: 'none',
        },
      ],
      paddingBottom: 'xl',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'image',
          url: 'https://wpd-bucket.sgp1.cdn.digitaloceanspaces.com/assets/how-to-use.png',
          size: 'full',
          aspectRatio: '4:3',
          aspectMode: 'cover',
          offsetTop: 'none',
        },
      ],
      offsetTop: 'none',
      paddingAll: 'none',
    },
  },
};
