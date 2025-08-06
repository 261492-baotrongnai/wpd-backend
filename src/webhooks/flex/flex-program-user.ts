import * as line from '@line/bot-sdk';
export const ProgramUserFlex = (
  program: string,
): line.messagingApi.FlexMessage => {
  return {
    type: 'flex',
    altText: 'ตั้งค่าผู้เข้าร่วมโครงการ',
    contents: {
      type: 'bubble',
      size: 'giga',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: ` มะลิตั้งค่าให้คุณอยู่ในโครงการ "${program}" เรียบร้อยแล้วค่ะ👍🏻`,
            size: 'md',
            wrap: true,
            scaling: true,
            margin: 'sm',
          },
          {
            type: 'text',
            text: ' มะลิจะช่วยให้การติดตามสุขภาพเป็นเรื่องง่ายขึ้นนะคะ💗',
            size: 'md',
            wrap: true,
            scaling: true,
            margin: 'sm',
          },
        ],
        paddingTop: 'xl',
        paddingBottom: 'xl',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'image',
            url: 'https://i.postimg.cc/jdhPQ9Lp/image.avif',
            size: 'full',
            aspectRatio: '2:1',
            aspectMode: 'cover',
            offsetTop: 'none',
          },
        ],
        offsetTop: 'none',
        paddingAll: 'none',
      },
    },
  };
};
