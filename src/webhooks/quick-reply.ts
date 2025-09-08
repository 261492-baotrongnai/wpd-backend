import { messagingApi } from '@line/bot-sdk';

export const ImageQuickReply: messagingApi.QuickReply = {
  items: [
    {
      type: 'action',
      action: {
        type: 'camera',
        label: 'เปิดกล้อง',
      },
    },
    {
      type: 'action',
      action: {
        type: 'cameraRoll',
        label: 'อัลบั้มรูป',
      },
    },
    {
      type: 'action',
      action: {
        type: 'message',
        label: 'ยกเลิกการบันทึก',
        text: 'ยกเลิก',
      },
    },
  ],
};

export const CancleQuickReply: messagingApi.QuickReply = {
  items: [
    {
      type: 'action',
      action: {
        type: 'message',
        label: 'ยกเลิกการบันทึก',
        text: 'ยกเลิก',
      },
    },
  ],
};

export const canEatCheckImageQuickReply: messagingApi.QuickReply = {
  items: [
    {
      type: 'action',
      action: {
        type: 'camera',
        label: 'เปิดกล้อง',
      },
    },
    {
      type: 'action',
      action: {
        type: 'cameraRoll',
        label: 'อัลบั้มรูป',
      },
    },
    {
      type: 'action',
      action: {
        type: 'message',
        label: 'ยกเลิกกินได้ก่อ',
        text: 'ยกเลิก',
      },
    },
  ],
};

export const DecideToRecordQuickReply: messagingApi.QuickReply = {
  items: [{
      type: 'action',
      action: {
        type: 'message',
        label: 'บันทึกเมนูนี้',
        text: 'บันทึกเมนูนี้',
      },
    },
  {
      type: 'action',
      action: {
        type: 'message',
        label: 'ไม่บันทึกเมนูนี้',
        text: 'ไม่บันทึกเมนูนี้',
      },
    },]
}
