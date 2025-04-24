import { messagingApi } from '@line/bot-sdk';

// FlexMessage type มันโดน deprecated ไปแล้วให้เรียก type ผ่าน messagingApi เท่านั้น (แต่ doc ไม่เขียนไว้ จะบ้า)
export const GreetingFlex: messagingApi.FlexMessage = {
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
