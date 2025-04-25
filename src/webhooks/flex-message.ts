import { messagingApi } from '@line/bot-sdk';

// FlexMessage type มันโดน deprecated ไปแล้วให้เรียก type ผ่าน messagingApi เท่านั้น (แต่ doc ไม่เขียนไว้ จะบ้า)
export const ClassifyFlex: messagingApi.FlexMessage = {
  type: 'flex',
  altText: 'โปรดเลือกประเภทผู้ใช้ของคุณ',
  contents: {
    type: 'bubble',
    hero: {
      type: 'image',
      url: 'https://i.postimg.cc/3xh95LDs/image.png',
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: 'กดเลือกตรงนี้',
                uri: 'https://liff.line.me/2007211748-NYb7nX3z',
              },
              color: '#434343',
              height: 'md',
              margin: 'none',
            },
          ],
          backgroundColor: '#D1E5FF',
          borderWidth: 'none',
          cornerRadius: 'lg',
          margin: 'none',
          spacing: 'none',
          justifyContent: 'center',
          alignItems: 'center',
          paddingAll: 'none',
        },
      ],
      flex: 0,
    },
  },
};

export const GreetingFlex: messagingApi.FlexMessage = {
  type: 'flex',
  altText: 'ยินดีต้อนรับสู่ LINE หวานพอดี',
  contents: {
    type: 'bubble',
    size: 'mega',
    hero: {
      type: 'image',
      url: 'https://i.postimg.cc/Kjkshsph/welcome.png',
      size: 'full',
      aspectRatio: '2:1',
      aspectMode: 'cover',
      margin: 'none',
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
              text: 'สวัสดีค่ะ มะลิเองค่ะ😊',
              wrap: true,
              contents: [],
              size: 'md',
              offsetBottom: 'none',
              offsetTop: 'xs',
            },
            {
              type: 'text',
              text: 'มะลิจะคอยเป็นผู้ช่วยดูแลสุขภาพให้คุณเองนะคะ',
              wrap: true,
              offsetTop: 'none',
              margin: 'md',
              size: 'md',
              color: '#555555',
            },
          ],
        },
        {
          type: 'text',
          margin: 'xxl',
          wrap: true,
          color: '#434343',
          contents: [],
          size: 'md',
          text: 'ก่อนเริ่มใช้งาน เลือกกลุ่มผู้ใช้ที่ตรงกับตัวเองด้านล่างก่อนนะคะ⬇️',
          offsetBottom: 'xs',
        },
      ],
      margin: 'sm',
      paddingAll: 'xxl',
    },
    styles: {
      footer: {
        separator: true,
      },
    },
  },
};
