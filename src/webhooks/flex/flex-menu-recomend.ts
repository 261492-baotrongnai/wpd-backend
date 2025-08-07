import * as line from '@line/bot-sdk';

// ช่วยเลือกเมนู จากใน db

export const MenuRecomendFlex = (
  contents: line.messagingApi.FlexBubble[],
): line.messagingApi.FlexCarousel => {
  return {
    type: 'carousel',
    contents: contents,
  };
};

export const MenuRecomendContent = (
  menu_name: string[],
): line.messagingApi.FlexBubble[] => {
  return menu_name.map((name) => ({
    type: 'bubble',
    size: 'deca',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: name,
          weight: 'bold',
          size: 'lg',
          wrap: true,
          align: 'center',
          scaling: true,
          offsetTop: 'sm',
        },
        {
          type: 'text',
          text: 'คะแนนสุขภาพ : A',
          color: '#059F3B',
          align: 'center',
          margin: 'md',
          size: 'md',
          wrap: true,
          scaling: true,
        },
      ],
      spacing: 'sm',
      paddingAll: '13px',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'image',
          url: 'https://i.postimg.cc/52JCYbqj/mini.png',
          aspectRatio: '2:1',
          aspectMode: 'cover',
          size: 'full',
          offsetTop: 'none',
          offsetStart: 'none',
        },
      ],
      paddingAll: 'none',
      offsetTop: 'none',
      offsetBottom: 'none',
    },
  }));
};
