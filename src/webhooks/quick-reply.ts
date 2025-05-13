import { messagingApi } from '@line/bot-sdk';

export const ImageQuickReply: messagingApi.QuickReply = {
  items: [
    {
      type: 'action',
      action: {
        type: 'camera',
        label: 'Camera',
      },
    },
    {
      type: 'action',
      action: {
        type: 'cameraRoll',
        label: 'Gallery',
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
