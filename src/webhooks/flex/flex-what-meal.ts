import * as line from '@line/bot-sdk';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CancleQuickReply } from '../quick-reply';

const BoxColor = ['#F2F8FC', '#E2F4FF', '#C8E9FF', '#D1E5FF'];

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
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'เลือกเมนูอาหารที่',
            align: 'center',
            offsetBottom: 'none',
            offsetTop: 'xs',
            weight: 'bold',
            size: 'lg',
            scaling: true,
            wrap: true,
            margin: 'none',
          },
          {
            type: 'text',
            text: 'มะลิคิดว่าใกล้เคียงกับ',
            weight: 'bold',
            align: 'center',
            size: 'lg',
            wrap: true,
            scaling: true,
            margin: 'sm',
          },
          {
            type: 'text',
            text: 'อาหารในรูปดูนะคะ',
            weight: 'bold',
            align: 'center',
            size: 'lg',
            scaling: true,
            wrap: true,
            margin: 'sm',
            offsetBottom: 'none',
          },
          {
            type: 'separator',
            margin: 'xxl',
          },
          ...contents,
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#FFE1B1',
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
                text: 'ยังไม่เจอเมนูที่ใช่',
                wrap: true,
                size: 'md',
                align: 'center',
                color: '#333333',
                weight: 'regular',
                scaling: true,
              },
              {
                type: 'text',
                text: 'ขอพิมพ์ชื่ออาหารเอง📝',
                wrap: true,
                size: 'md',
                align: 'center',
                color: '#333333',
                margin: 'sm',
                weight: 'regular',
                scaling: true,
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
    backgroundColor: BoxColor[candidates.indexOf(candidate)],
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
        size: 'md',
        align: 'center',
        color: '#333333',
        weight: 'regular',
        scaling: true,
      },
    ],
    offsetTop: 'none',
    borderWidth: 'normal',
    borderColor: '#EAEAEA',
  }));
};
