import * as line from '@line/bot-sdk';

export const RecordOrNot = (): line.messagingApi.FlexMessage => {
  return {
    type: 'flex',
    altText: 'ต้องการบันทึกเมนูนี้เลยไหมคะ?',
    contents: {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'lg',
        contents: [
          {
            type: 'text',
            text: 'ต้องการบันทึกเมนูนี้เลยไหมคะ?',
            weight: 'bold',
            size: '18px',
            wrap: true,
            align: 'center',
            contents: [],
          },
          {
            type: 'separator',
          },
        ],
        paddingBottom: 'xs',
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'บันทึกเมนูนี้',
                action: {
                  type: 'message',
                  label: 'บันทึกเมนูนี้',
                  text: 'บันทึกเมนูนี้',
                },
                size: '16px',
                align: 'center',
                gravity: 'center',
              },
            ],
            backgroundColor: '#E0FFB2',
            paddingAll: 'lg',
            cornerRadius: 'md',
            justifyContent: 'center',
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'ยังไม่บันทึกเมนูนี้',
                action: {
                  type: 'message',
                  label: 'ไม่บันทึกเมนูนี้',
                  text: 'ไม่บันทึกเมนูนี้',
                },
                size: '16px',
                align: 'center',
                wrap: true,
              },
            ],
            backgroundColor: '#EBEBEB',
            paddingAll: 'lg',
            cornerRadius: 'md',
          },
        ],
        paddingBottom: 'xl',
        paddingStart: 'lg',
        paddingEnd: 'lg',
      },
    },
  };
};

export const canEatCheckSummary = (
  foodName: string,
  oldAvgGrade: string,
  foodAvgGrade: string,
  newAvgGrade: string,
  oldAvgScore: number,
  newAvgScore: number,
): line.messagingApi.FlexMessage => {
  return {
    type: 'flex',
    altText: 'สรุปภาพรวมของเมนู',
    contents: {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'lg',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: 'มาลองประเมินกันค่ะ',
            weight: 'bold',
            size: 'xl',
            color: '#194678',
            wrap: true,
          },
          {
            type: 'text',
            text: 'ว่าเมนูนี้ดีต่อเราไหมนะ',
            size: 'md',
            color: '#194678',
            margin: 'sm',
          },
          {
            type: 'separator',
          },
          foodNamePart(foodName, foodAvgGrade),
          foodAvgGradePart(foodAvgGrade),
          summaryPart(oldAvgGrade, newAvgGrade, oldAvgScore, newAvgScore),
        ],
      },
    },
  };
};

const greenBarCode = '#008B4C';

const colorOfGrade = (grade: string): string => {
  switch (grade) {
    case 'A':
      return '#065F46';
    case 'B':
      return '#BC971E';
    case 'C':
      return '#D83829';
    default:
      return '#000000';
  }
};

const ceilIfHalf = (number: number) => {
  return number % 1 >= 0.5 ? Math.ceil(number) : Math.floor(number);
};

const scoreToBarProgress = (score: number): string => {
  const minScore = 1;
  const maxScore = 3;
  if (score <= minScore) return '100%';
  else if (score >= maxScore) return '1%';
  else {
    const percentage = (maxScore - score) / (maxScore - minScore) * 100;
    const intPercentage = ceilIfHalf(percentage);

    return intPercentage.toString() + '%';
  }
};

const summaryBarLabel: line.messagingApi.FlexComponent = {
  type: 'box',
  layout: 'horizontal',
  contents: [
    {
      type: 'text',
      text: 'C',
      size: 'md',
      color: colorOfGrade('C'),
      align: 'start',
    },
    {
      type: 'filler',
    },
    {
      type: 'text',
      text: 'B',
      size: 'md',
      color: colorOfGrade('B'),
      align: 'center',
    },
    {
      type: 'filler',
    },
    {
      type: 'text',
      text: 'A',
      size: 'md',
      color: colorOfGrade('A'),
      align: 'end',
    },
  ],
};


const summaryGradePart = (
  oldAvgGrade: string,
  newAvgGrade: string,
): line.messagingApi.FlexComponent => {
  return {
    type: 'text',
    align: 'center',
    size: '3xl',
    weight: 'bold',
    contents: [
      {
        type: 'span',
        text: oldAvgGrade,
        color: colorOfGrade(oldAvgGrade),
      },
      {
        type: 'span',
        text: '→ ',
        color: '#9CA3AF',
        size: 'xxl',
      },
      {
        type: 'span',
        text: newAvgGrade,
        color: colorOfGrade(newAvgGrade),
      },
    ],
    offsetTop: 'sm',
    margin: 'sm',
    gravity: 'center',
  };
};

const summaryBarPart = (
  oldAvgGrade: string,
  newAvgGrade: string,
  oldAvgScore: number,
  newAvgScore: number,
): line.messagingApi.FlexComponent => {
  console.log('log old and new score', oldAvgScore, newAvgScore);
  console.log('log grade', oldAvgGrade, newAvgGrade);
  return {
    type: 'box',
    layout: 'vertical',
    height: '25px',
    position: 'relative',
    contents: [
      {
        type: 'box',
        layout: 'vertical',
        height: '8px',
        backgroundColor: '#E5E7EB',
        cornerRadius: '999px',
        position: 'absolute',
        offsetTop: '13px',
        offsetStart: '0px',
        offsetEnd: '0px',
        contents: [],
      },
      {
        type: 'box',
        layout: 'vertical',
        height: '8px',
        backgroundColor: '#CECECE',
        cornerRadius: '999px',
        position: 'absolute',
        offsetTop: '13px',
        offsetStart: '0px',
        width: scoreToBarProgress(oldAvgScore),
        contents: [],
      },
      {
        type: 'box',
        layout: 'vertical',
        height: '8px',
        backgroundColor:
          newAvgGrade === 'A' ? greenBarCode : colorOfGrade(newAvgGrade),
        cornerRadius: '999px',
        position: 'absolute',
        offsetTop: '13px',
        offsetStart: '0px',
        width: scoreToBarProgress(newAvgScore),
        contents: [],
      },
    ],
    margin: 'sm',
  };
};

const summaryPart = (
  oldAvgGrade: string,
  newAvgGrade: string,
  oldAvgScore: number,
  newAvgScore: number,
): line.messagingApi.FlexComponent => {
  return {
    type: 'box',
    layout: 'vertical',
    cornerRadius: '12px',
    paddingAll: '12px',
    backgroundColor: '#F7F7F7',
    borderColor: '#EFEFEF',
    borderWidth: 'normal',
    contents: [
      {
        type: 'text',
        align: 'center',
        size: 'lg',
        color: '#434343',
        contents: [
          {
            type: 'span',
            text: 'เกรดเฉลี่ยวันนี้ ',
          },
          {
            type: 'span',
            text: 'หลังเพิ่มเมนูนี้',
            weight: 'bold',
            decoration: 'underline',
          },
        ],
        margin: 'xs',
      },
      summaryGradePart(oldAvgGrade, newAvgGrade),
      summaryBarPart(oldAvgGrade, newAvgGrade, oldAvgScore, newAvgScore),
      summaryBarLabel,
    ],
  };
};

const foodGradeBorderColor = (foodAvgGrade: string): string => {
  switch (foodAvgGrade) {
    case 'A':
      return '#C0E99B';
    case 'B':
      return '#F7ED8D';
    case 'C':
      return '#ECBCB8';
    default:
      return '#000000';
  }
};

const foodGradeBgColor = (foodAvgGrade: string): string => {
  switch (foodAvgGrade) {
    case 'A':
      return '#F8FFF2';
    case 'B':
      return '#FFFCE2';
    case 'C':
      return '#FFEAE8';
    default:
      return '#ffffffff';
  }
};

const shortSuggestion = (foodAvgGrade: string): string => {
  switch (foodAvgGrade) {
    case 'A':
      return 'ควรเลือกบริโภค';
    case 'B':
      return 'บริโภคพอประมาณ';
    case 'C':
      return 'ควรเลี่ยง';
    default:
      return '';
  }
};

const foodAvgGradePart = (
  foodAvgGrade: string,
): line.messagingApi.FlexComponent => {
  const textColor = colorOfGrade(foodAvgGrade);
  return {
    type: 'box',
    layout: 'vertical',
    cornerRadius: '12px',
    paddingAll: '12px',
    borderColor: foodGradeBorderColor(foodAvgGrade),
    borderWidth: 'normal',
    backgroundColor: foodGradeBgColor(foodAvgGrade),
    contents: [
      {
        type: 'text',
        text: 'เกรดเมนู',
        align: 'center',
        size: 'lg',
        color: textColor,
      },
      {
        type: 'text',
        text: foodAvgGrade,
        align: 'center',
        size: 'xxl',
        weight: 'bold',
        color: textColor,
        margin: 'xs',
      },
      {
        type: 'text',
        text: shortSuggestion(foodAvgGrade),
        align: 'center',
        size: 'lg',
        weight: 'bold',
        color: textColor,
      },
    ],
  };
};

const foodNamePart = (
  foodName: string,
  foodAvgGrade: string,
): line.messagingApi.FlexComponent => {
  return {
    type: 'text',
    text: foodName,
    size: 'xl',
    weight: 'bold',
    color: colorOfGrade(foodAvgGrade),
    align: 'center',
    wrap: true,
    margin: 'lg',
  };
};
