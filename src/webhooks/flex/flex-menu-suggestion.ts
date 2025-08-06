import * as line from '@line/bot-sdk';
// ตอบกลับ กินได้ก่อ
export const GoodMenuFlex = (
  menu_name: string,
  message: ' มื้อนี้ดูดีมากเลยค่ะ ทานได้ตามปกติเลยนะคะ😊',
): line.messagingApi.FlexMessage => {
  return {
    type: 'flex',
    altText: 'เมนูแนะนำ',
    contents: {
      type: 'bubble',
      size: 'mega',
      hero: {
        type: 'image',
        url: 'https://i.postimg.cc/htcW6wcN/image.png',
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
                text: 'สรุป : กินได้ค่ะ✅',
                offsetTop: 'xs',
                weight: 'bold',
                margin: 'md',
                scaling: true,
                wrap: true,
                color: '#059F3B',
                size: 'lg',
              },
              {
                type: 'text',
                text: message,
                wrap: true,
                offsetStart: 'none',
                offsetTop: 'md',
                scaling: true,
                margin: 'sm',
              },
            ],
            paddingTop: 'md',
            paddingBottom: 'md',
            paddingStart: 'md',
            paddingAll: 'none',
            paddingEnd: 'none',
            offsetEnd: 'none',
            offsetBottom: 'none',
          },
        ],
        paddingBottom: 'xxl',
        paddingTop: 'xxl',
        paddingAll: 'none',
        paddingStart: 'lg',
        paddingEnd: 'xl',
        position: 'relative',
      },
    },
  };
};

export const NeutralMenuFlex = (
  menu_name: string,
  message: ' ถ้าลองแบ่งหรือลดปริมาณสักหน่อย มะลิว่ากำลังพอดีเลยค่ะ',
): line.messagingApi.FlexMessage => {
  return {
    type: 'flex',
    altText: message,
    contents: {
      type: 'bubble',
      size: 'mega',
      hero: {
        type: 'image',
        url: 'https://i.postimg.cc/dV6w11Xn/image.png',
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
                text: 'สรุป : พอกินได้ค่ะ🟡',
                offsetTop: 'xs',
                weight: 'bold',
                margin: 'md',
                scaling: true,
                wrap: true,
                color: '#BC971E',
                size: 'lg',
              },
              {
                type: 'text',
                text: message,
                wrap: true,
                offsetStart: 'none',
                offsetTop: 'md',
                scaling: true,
                margin: 'sm',
              },
            ],
            paddingTop: 'md',
            paddingBottom: 'md',
            paddingStart: 'md',
            paddingAll: 'none',
            paddingEnd: 'none',
            offsetEnd: 'none',
            offsetBottom: 'none',
          },
        ],
        paddingBottom: 'xxl',
        paddingTop: 'xxl',
        paddingAll: 'none',
        paddingStart: 'lg',
        paddingEnd: 'xl',
        position: 'relative',
      },
    },
  };
};

export const NotGoodMenuFlex = (
  menu_name: string,
  message: ' เมนูนี้อยู่ในกลุ่มที่ควรงดค่ะ ลองปรับเปลี่ยนดูนิดนึงเพื่อสุขภาพที่ดีกว่านะคะ',
): line.messagingApi.FlexMessage => {
  return {
    type: 'flex',
    altText: message,
    contents: {
      type: 'bubble',
      size: 'mega',
      hero: {
        type: 'image',
        url: 'https://i.postimg.cc/DzzFbh3h/image.png',
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
                text: 'สรุป : กินไม่ได้ค่ะ❌',
                offsetTop: 'xs',
                weight: 'bold',
                margin: 'md',
                scaling: true,
                wrap: true,
                color: '#D83829',
                size: 'lg',
              },
              {
                type: 'text',
                text: message,
                wrap: true,
                offsetStart: 'none',
                offsetTop: 'md',
                scaling: true,
                margin: 'sm',
              },
            ],
            paddingTop: 'md',
            paddingBottom: 'md',
            paddingStart: 'md',
            paddingAll: 'none',
            paddingEnd: 'none',
            offsetEnd: 'none',
            offsetBottom: 'none',
          },
        ],
        paddingBottom: 'xxl',
        paddingTop: 'xxl',
        paddingAll: 'none',
        paddingStart: 'lg',
        paddingEnd: 'xl',
        position: 'relative',
      },
    },
  };
};
