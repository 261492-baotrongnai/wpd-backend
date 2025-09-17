import * as line from '@line/bot-sdk';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CancleQuickReply } from '../quick-reply';

// const BoxColor = ['#F2F8FC', '#E2F4FF', '#C8E9FF', '#D1E5FF'];

export const MenuChoiceConfirmFlex = (
  contents: line.messagingApi.FlexComponent[],
): line.messagingApi.FlexMessage => {
  const config = new ConfigService();
  const liff_menu_input = `${config.get<string>('MENU_INPUT')}`;
  Logger.debug(liff_menu_input, 'LIFF URL');
  return {
    type: 'flex',
    altText: 'โปรดเลือกชื่อเมนูอาหารที่ถูกต้อง',
    contents: {
      type: 'bubble',
      size: 'giga',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'เลือกเมนูอาหารที่ใกล้เคียง',
            align: 'center',
            offsetBottom: 'none',
            offsetTop: 'xs',
            weight: 'bold',
            size: '20px',
            wrap: true,
          },
          {
            type: 'text',
            text: 'กับอาหารในรูปดูนะคะ',
            weight: 'bold',
            align: 'center',
            size: '20px',
            wrap: true,
            margin: 'sm',
          },
          {
            type: 'separator',
            margin: '16px',
          },
          ...contents,
          {
            type: 'separator',
            margin: 'xl',
          },
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#F5F5F5',
            cornerRadius: 'md',
            margin: 'xl',
            paddingAll: 'lg',
            action: {
              type: 'uri',
              label: 'ไม่มีเมนูที่ถูกต้อง พิมพ์ชื่ออาหารเอง',
              uri: liff_menu_input,
            },
            contents: [
              {
                type: 'text',
                text: 'ไม่เจอเมนูที่ใช่',
                wrap: true,
                size: '18px',
                align: 'center',
                color: '#555555',
                weight: 'regular',
              },
              {
                type: 'text',
                text: 'กดพิมพ์เองตรงนี้ได้เลย ✏️',
                wrap: true,
                size: '18px',
                align: 'center',
                color: '#555555',
                margin: '6px',
                weight: 'regular',
              },
            ],
            borderWidth: 'normal',
            borderColor: '#EAEAEA',
          },
        ],
        paddingAll: 'xl',
        spacing: 'none',
        position: 'relative',
      },
    },
    quickReply: CancleQuickReply,
  };
};

export const CandidateContents = (
  candidates: { name: string }[],
): line.messagingApi.FlexComponent[] => {
  return candidates.map((candidate) => ({
    type: 'box',
    layout: 'vertical',
    // backgroundColor: BoxColor[candidates.indexOf(candidate)],
    backgroundColor: '#E2F4FF',
    margin: 'xl',
    cornerRadius: 'md',
    paddingAll: 'lg',
    action: {
      type: 'message',
      label: candidate.name,
      text: candidate.name,
    },
    contents: [
      {
        type: 'text',
        text: candidate.name,
        wrap: true,
        size: '20px',
        align: 'center',
        color: '#333333',
        weight: 'regular',
      },
    ],
    offsetTop: 'none',
    borderWidth: 'normal',
    borderColor: '#EAEAEA',
  }));
};
