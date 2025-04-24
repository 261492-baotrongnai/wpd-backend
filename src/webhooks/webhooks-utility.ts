import * as crypto from 'crypto';
import axios from 'axios';

export function verifySignature(
  channelSecret: string,
  body: string,
  signature: string,
): boolean {
  console.log('Verifying signature...');
  //   console.log('Channel Secret:', channelSecret);
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
}

export const createReply = async (
  replyToken: string,
  message: JSON[],
): Promise<void> => {
  const url = 'https://api.line.me/v2/bot/message/reply';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
  };
  const body = {
    replyToken,
    messages: message,
  };

  try {
    await axios.post(url, body, { headers });
    console.log('Reply sent successfully');
  } catch (error) {
    console.error(
      'Error sending reply:',
      error.response?.data || error.message,
    );
  }
};
