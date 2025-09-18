import * as line from '@line/bot-sdk';
import { CancleQuickReply } from '../quick-reply';

const MealInfo: {
  text: string;
  bgColor: string;
}[] = [
  {
    text: 'มื้อเช้า ⛅️',
    bgColor: '#FFF8CC',
  },
  {
    text: 'มื้อกลางวัน ☀️',
    bgColor: '#D5F5D0',
  },
  {
    text: 'มื้อเย็น ☁️',
    bgColor: '#D7EDFB',
  },
  {
    text: 'ของว่าง 🍉',
    bgColor: '#EADCF3',
  },
];

const constructChoice = (text, bgColor): line.messagingApi.FlexComponent => {
  return {
    type: 'box',
    layout: 'vertical',
    contents: [
      {
        type: 'text',
        text: text,
        align: 'center',
        size: '20px',
        color: '#333333',
        action: {
          type: 'message',
          label: text,
          text: text,
        },
        weight: 'regular',
        margin: 'none',
        offsetTop: 'none',
      },
    ],
    backgroundColor: bgColor,
    margin: 'lg',
    cornerRadius: 'md',
    paddingAll: 'lg',
  };
};

const mealChoicePart: line.messagingApi.FlexComponent[] = MealInfo.map(
  ({ text, bgColor }) => constructChoice(text, bgColor),
);

export const WhatMealFlex: line.messagingApi.FlexMessage = {
  type: 'flex',
  altText: 'มะลิอยากรู้ว่ามื้อไหนที่คุณทาน',
  contents: {
    type: 'bubble',
    size: 'mega',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: 'อาหารในรูปนี้เป็นมื้อไหนคะ?',
          align: 'center',
          offsetBottom: 'none',
          offsetTop: 'xs',
          weight: 'bold',
          size: 'lg',
          wrap: true,
        },
        {
          type: 'separator',
          margin: 'lg',
        },
        ...mealChoicePart,
      ],
    },
  },
  quickReply: CancleQuickReply,
};
