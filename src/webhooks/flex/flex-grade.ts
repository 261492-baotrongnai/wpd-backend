import { messagingApi } from '@line/bot-sdk';

type Grade = 'A' | 'B' | 'C';

// export const GradeAFlex = (menu_name: string): messagingApi.FlexMessage => {
//   return {
//     type: 'flex',
//     altText: 'Grade A',
//     contents: {
//       type: 'bubble',
//       size: 'mega',
//       hero: {
//         type: 'image',
//         url: 'https://i.postimg.cc/G3Kjr3QK/grade-A.png',
//         aspectRatio: '2:1',
//         aspectMode: 'fit',
//         size: 'full',
//       },
//       body: {
//         type: 'box',
//         layout: 'vertical',
//         contents: [
//           {
//             type: 'box',
//             layout: 'vertical',
//             contents: [
//               {
//                 type: 'text',
//                 text: menu_name,
//                 size: 'lg',
//                 wrap: true,
//                 weight: 'bold',
//                 align: 'center',
//               },
//             ],
//             paddingBottom: 'sm',
//           },
//           {
//             type: 'separator',
//             margin: 'lg',
//           },
//           {
//             type: 'box',
//             layout: 'vertical',
//             contents: [
//               {
//                 type: 'text',
//                 text: 'คะแนนสุขภาพ : A',
//                 offsetTop: 'xs',
//                 weight: 'bold',
//                 margin: 'md',
//               },
//               {
//                 type: 'text',
//                 text: ' ดีมากค่ะ รักษาแบบนี้ไว้นะคะ สุขภาพดีเริ่มจากจานนี้เลยค่ะ',
//                 wrap: true,
//                 offsetStart: 'none',
//                 offsetTop: 'md',
//               },
//               {
//                 type: 'text',
//                 margin: 'xxl',
//                 weight: 'bold',
//                 contents: [
//                   {
//                     type: 'span',
//                     text: 'ข้อแนะนำ : ',
//                   },
//                   {
//                     type: 'span',
//                     text: 'ถ้าเติมผักในมื้อนี้ จะดีต่อสุขภาพมากขึ้นค่ะ',
//                     weight: 'regular',
//                   },
//                 ],
//                 wrap: true,
//                 offsetTop: 'none',
//                 offsetBottom: 'none',
//               },
//             ],
//             paddingTop: 'md',
//             paddingBottom: 'md',
//             paddingStart: 'md',
//             paddingAll: 'none',
//             paddingEnd: 'md',
//           },
//         ],
//         paddingBottom: 'xxl',
//         paddingTop: 'xxl',
//         paddingAll: 'lg',
//       },
//     },
//   };
// };

// export const GradeBFlex = (menu_name: string): messagingApi.FlexMessage => {
//   return {
//     type: 'flex',
//     altText: 'Grade B',
//     contents: {
//       type: 'bubble',
//       size: 'mega',
//       hero: {
//         type: 'image',
//         url: 'https://i.postimg.cc/5ys5mp0T/grade-B.png',
//         aspectRatio: '2:1',
//         aspectMode: 'fit',
//         size: 'full',
//       },
//       body: {
//         type: 'box',
//         layout: 'vertical',
//         contents: [
//           {
//             type: 'box',
//             layout: 'vertical',
//             contents: [
//               {
//                 type: 'text',
//                 text: menu_name,
//                 size: 'lg',
//                 wrap: true,
//                 weight: 'bold',
//                 align: 'center',
//               },
//             ],
//             paddingBottom: 'sm',
//           },
//           {
//             type: 'separator',
//             margin: 'lg',
//           },
//           {
//             type: 'box',
//             layout: 'vertical',
//             contents: [
//               {
//                 type: 'text',
//                 text: 'คะแนนสุขภาพ : B',
//                 offsetTop: 'xs',
//                 weight: 'bold',
//                 margin: 'md',
//               },
//               {
//                 type: 'text',
//                 text: ' มื้อนี้ยังพอไหวค่ะ ถ้าเบาลงได้นิดหน่อยจะดีมากเลยนะคะ',
//                 wrap: true,
//                 offsetStart: 'none',
//                 offsetTop: 'md',
//               },
//               {
//                 type: 'text',
//                 margin: 'xxl',
//                 weight: 'bold',
//                 contents: [
//                   {
//                     type: 'span',
//                     text: 'ข้อแนะนำ : ',
//                   },
//                   {
//                     type: 'span',
//                     text: 'ถ้าเติมผักในมื้อนี้ จะดีต่อสุขภาพมากขึ้นค่ะ',
//                     weight: 'regular',
//                   },
//                 ],
//                 wrap: true,
//                 offsetTop: 'none',
//                 offsetBottom: 'none',
//               },
//             ],
//             paddingTop: 'md',
//             paddingBottom: 'md',
//             paddingStart: 'md',
//             paddingAll: 'none',
//             paddingEnd: 'md',
//           },
//         ],
//         paddingBottom: 'xxl',
//         paddingTop: 'xxl',
//         paddingAll: 'lg',
//       },
//     },
//   };
// };

// export const GradeCFlex = (menu_name: string): messagingApi.FlexMessage => {
//   return {
//     type: 'flex',
//     altText: 'Grade C',
//     contents: {
//       type: 'bubble',
//       size: 'mega',
//       hero: {
//         type: 'image',
//         url: 'https://i.postimg.cc/sxj9SbV5/grade-C.png',
//         aspectRatio: '2:1',
//         aspectMode: 'fit',
//         size: 'full',
//       },
//       body: {
//         type: 'box',
//         layout: 'vertical',
//         contents: [
//           {
//             type: 'box',
//             layout: 'vertical',
//             contents: [
//               {
//                 type: 'text',
//                 text: menu_name,
//                 size: 'lg',
//                 wrap: true,
//                 weight: 'bold',
//                 align: 'center',
//               },
//             ],
//             paddingBottom: 'sm',
//           },
//           {
//             type: 'separator',
//             margin: 'lg',
//           },
//           {
//             type: 'box',
//             layout: 'vertical',
//             contents: [
//               {
//                 type: 'text',
//                 text: 'คะแนนสุขภาพ : C',
//                 offsetTop: 'xs',
//                 weight: 'bold',
//                 margin: 'md',
//               },
//               {
//                 type: 'text',
//                 text: ' มื้อนี้มะลิอยากให้เลี่ยงเลยนะคะ เพื่อสุขภาพที่ดีในระยะยาวค่ะ',
//                 wrap: true,
//                 offsetStart: 'none',
//                 offsetTop: 'md',
//               },
//               {
//                 type: 'text',
//                 margin: 'xxl',
//                 weight: 'bold',
//                 contents: [
//                   {
//                     type: 'span',
//                     text: 'ข้อแนะนำ : ',
//                   },
//                   {
//                     type: 'span',
//                     text: 'ถ้าเติมผักในมื้อนี้ จะดีต่อสุขภาพมากขึ้นค่ะ',
//                     weight: 'regular',
//                   },
//                 ],
//                 wrap: true,
//                 offsetTop: 'none',
//                 offsetBottom: 'none',
//               },
//             ],
//             paddingTop: 'md',
//             paddingBottom: 'md',
//             paddingStart: 'md',
//             paddingAll: 'none',
//             paddingEnd: 'md',
//           },
//         ],
//         paddingBottom: 'xxl',
//         paddingTop: 'xxl',
//         paddingAll: 'lg',
//       },
//     },
//   };
// };

// const GradeInfo = {
//   A: {
//     message: ' มื้อนี้ดีมากค่ะ รักษาแบบนี้ไว้นะคะ สุขภาพดีเริ่มจากจานนี้เลยค่ะ',
//     imageUrl: 'https://i.postimg.cc/G3Kjr3QK/grade-A.png',
//     suggest_preset: [
//       'เมนูนี้เป็นตัวเลือกที่เหมาะกับการดูแลสุขภาพค่ะ',
//       'เมนูนี้ดีต่อสุขภาพค่ะ ลองสลับกับเมนูอื่นบ้างเพื่อให้หลากหลายนะคะ',
//       'ทานเมนูนี้ได้บ่อยค่ะ แต่อย่าลืมเพิ่มความหลากหลายให้ทุกมื้อนะคะ',
//       'ถ้าสลับกับเมนูอื่นที่ชอบ จะช่วยให้ได้รับสารอาหารที่หลากหลายค่ะ',
//       'เมนูนี้เหมาะกับสุขภาพค่ะ ถ้าเพิ่มความหลากหลายในแต่ละมื้อจะดีมากค่ะ',
//     ],
//     bgColor: '#059F3B',
//   },
//   B: {
//     message: ' มื้อนี้ยังพอไหวค่ะ ถ้าเบาลงได้นิดหน่อยจะดีมากเลยนะคะ',
//     imageUrl: 'https://i.postimg.cc/5ys5mp0T/grade-B.png',
//     suggest_preset: [
//       'ทานได้ค่ะ แต่อาจต้องใส่ใจเรื่องปริมาณเล็กน้อยนะคะ',
//       'เป็นเมนูที่เลือกทานได้เป็นบางครั้งค่ะ',
//       'เมนูนี้เหมาะกับการทานในบางโอกาสค่ะ',
//       'อาจต้องคอยสังเกตปริมาณในแต่ละมื้อนิดนึงนะคะ',
//       'ถ้าทานสลับกับเมนูอื่น ๆ จะช่วยให้สมดุลมากขึ้นค่ะ',
//       'เป็นเมนูที่เลือกได้ในบางโอกาส ควรเสริมด้วยความหลากหลายในมื้ออื่นนะคะ',
//     ],
//     bgColor: '#BC971E',
//   },
//   C: {
//     message: ' มื้อนี้มะลิอยากให้เลี่ยงเลยนะคะ เพื่อสุขภาพที่ดีในระยะยาวค่ะ',
//     imageUrl: 'https://i.postimg.cc/sxj9SbV5/grade-C.png',
// suggest_preset: [
//   'เมนูนี้อาจไม่เหมาะกับการทานบ่อยนักนะคะ',
//   'เป็นเมนูที่ควรระวังปริมาณและความถี่ในการทานค่ะ',
//   'ลองค่อย ๆ ปรับลดการเลือกเมนูนี้ดูนะคะ',
//   'เมนูนี้ควรหลีกเลี่ยงหากเป็นไปได้นะคะ เพื่อดูแลสุขภาพในระยะยาวค่ะ',
//   'เมนูนี้ไม่เหมาะกับการทานบ่อย ๆ ลองสลับเป็นเมนูอื่นแทนค่ะ',
//   'หากเลี่ยงได้ จะช่วยให้ดูแลสุขภาพได้ดีขึ้นในแต่ละวันค่ะ',
//   'เมนูนี้ควรทานให้น้อยที่สุด และแนะนำให้มีตัวเลือกที่หลากหลายขึ้นค่ะ',
//   'หากหลีกเลี่ยงเมนูนี้ได้ จะเป็นประโยชน์ต่อสุขภาพโดยรวมค่ะ',
//   'เมนูนี้ควรลดหรือหลีกเลี่ยง และลองเลือกเมนูที่ส่งเสริมสุขภาพมากขึ้นค่ะ',
// ],
//     bgColor: '#D83829',
//   },
// };

export const randomSuggest = (grade: Grade): string => {
  const suggestions = GradeInfo2[grade].suggest_preset;
  return suggestions[Math.floor(Math.random() * suggestions.length)];
};

// export const GradeFlex = (
//   grade: Grade,
//   menu_name: string,
//   ai_grading_menus?: string[],
// ): messagingApi.FlexMessage => {
//   const { message, imageUrl, bgColor } = GradeInfo[grade];
//   console.log(ai_grading_menus);
//   return {
//     type: 'flex',
//     altText: `มื้อนี้ของคุณได้ Grade ${grade}`,
//     contents: {
//       type: 'bubble',
//       size: 'mega',
//       hero: {
//         type: 'image',
//         url: imageUrl,
//         aspectRatio: '2:1',
//         aspectMode: 'fit',
//         size: 'full',
//       },
//       body: {
//         type: 'box',
//         layout: 'vertical',
//         contents: [
//           {
//             type: 'box',
//             layout: 'vertical',
//             contents: [
//               {
//                 type: 'text',
//                 text: menu_name,
//                 size: 'xl',
//                 wrap: true,
//                 weight: 'bold',
//                 align: 'center',
//                 scaling: true,
//               },
//             ],
//             paddingBottom: 'sm',
//           },
//           {
//             type: 'separator',
//             margin: 'lg',
//           },
//           {
//             type: 'box',
//             layout: 'vertical',
//             contents: [
//               {
//                 type: 'text',
//                 text: 'คะแนนสุขภาพ : ' + grade,
//                 offsetTop: 'xs',
//                 weight: 'bold',
//                 margin: 'md',
//                 scaling: true,
//                 wrap: true,
//                 color: bgColor,
//                 size: 'lg',
//               },
//               {
//                 type: 'text',
//                 text: message,
//                 wrap: true,
//                 offsetStart: 'none',
//                 offsetTop: 'lg',
//                 scaling: true,
//                 size: 'md',
//               },
//               {
//                 type: 'text',
//                 margin: 'xxl',
//                 weight: 'bold',
//                 contents: [
//                   {
//                     type: 'span',
//                     text: 'ข้อแนะนำ : ',
//                   },
//                   {
//                     type: 'span',
//                     text: randomSuggest(grade),
//                     weight: 'regular',
//                   },
//                 ],
//                 wrap: true,
//                 offsetTop: 'md',
//                 offsetBottom: 'none',
//                 scaling: true,
//               },
//             ],
//             paddingTop: 'md',
//             paddingBottom: 'md',
//             paddingStart: 'md',
//             paddingAll: 'none',
//             paddingEnd: 'md',
//           },
//         ],
//         paddingBottom: 'xxl',
//         paddingTop: 'xxl',
//         paddingAll: 'none',
//         paddingStart: 'lg',
//         paddingEnd: 'lg',
//         position: 'relative',
//         // ...((ai_grading_menus?.length ?? 0) > 0
//         //   ? { offsetBottom: 'none' }
//         //   : {}),
//       },
//       // ...((ai_grading_menus ?? []).length > 0
//       //   ? { footer: AIWarningFooter(ai_grading_menus ?? []) }
//       //   : {}),
//     },
//   };
// };

// export const AIWarningFooter = (menus: string[]): messagingApi.FlexBox => {
//   return {
//     type: 'box',
//     layout: 'vertical',
//     contents: [
//       {
//         type: 'separator',
//         margin: 'none',
//       },
//       {
//         type: 'text',
//         text: `⚠️ ข้อมูลของ ${menus.join(', ')} เป็นการประเมินเกรดจาก AI อาจจะมีความคลาดเคลื่อนไปบ้างค่ะ`,
//         margin: 'md',
//         size: 'sm',
//         scaling: true,
//         wrap: true,
//         align: 'start',
//         offsetTop: 'sm',
//       },
//     ],
//     paddingStart: 'lg',
//     paddingEnd: 'lg',
//     paddingTop: 'none',
//     paddingBottom: 'xxl',
//   };
// };

const GradeInfo2 = {
  A: {
    imageUrl: 'https://i.postimg.cc/G3Kjr3QK/grade-A.png',
    backgroundColor: '#F8FFF2',
    borderColor: '#C0E99B',
    gradeText: 'คะแนนสุขภาพ : A (ดีเยี่ยม)',
    gradeTextColor: '#059F3B',
    sugarLevelText: 'ค่าน้ำตาลต่ำกว่า 10 ✅',
    sugarDescription1: 'เปลี่ยนช้า ',
    sugarDescription2: 'ทานได้สบายใจค่ะ',
    suggest_preset: [
      'เมนูนี้เป็นตัวเลือกที่เหมาะกับการดูแลสุขภาพค่ะ',
      'เมนูนี้ดีต่อสุขภาพค่ะ ลองสลับกับเมนูอื่นบ้างเพื่อให้หลากหลายนะคะ',
      'ทานเมนูนี้ได้บ่อยค่ะ แต่อย่าลืมเพิ่มความหลากหลายให้ทุกมื้อนะคะ',
      'ถ้าสลับกับเมนูอื่นที่ชอบ จะช่วยให้ได้รับสารอาหารที่หลากหลายค่ะ',
      'เมนูนี้เหมาะกับสุขภาพค่ะ ถ้าเพิ่มความหลากหลายในแต่ละมื้อจะดีมากค่ะ',
    ],
  },
  B: {
    imageUrl: 'https://i.postimg.cc/5ys5mp0T/grade-B.png',
    backgroundColor: '#FFFCE2',
    borderColor: '#F7ED8D',
    gradeText: 'คะแนนสุขภาพ : B (ปานกลาง)',
    gradeTextColor: '#BC971E',
    sugarLevelText: 'ค่าน้ำตาล 11-19 ⚠️',
    sugarDescription1: 'ปานกลาง ',
    sugarDescription2: 'กินพอดี ๆ จะดีกว่าค่ะ',
    suggest_preset: [
      'ทานได้ค่ะ แต่อาจต้องใส่ใจเรื่องปริมาณเล็กน้อยนะคะ',
      'เป็นเมนูที่เลือกทานได้เป็นบางครั้งค่ะ',
      'เมนูนี้เหมาะกับการทานในบางโอกาสค่ะ',
      'อาจต้องคอยสังเกตปริมาณในแต่ละมื้อนิดนึงนะคะ',
      'ถ้าทานสลับกับเมนูอื่น ๆ จะช่วยให้สมดุลมากขึ้นค่ะ',
      'เป็นเมนูที่เลือกได้ในบางโอกาส ควรเสริมด้วยความหลากหลายในมื้ออื่นนะคะ',
    ],
  },
  C: {
    imageUrl: 'https://i.postimg.cc/sxj9SbV5/grade-C.png',
    backgroundColor: '#FFEFED',
    borderColor: '#ECBCB8',
    gradeText: 'คะแนนสุขภาพ : C (ควรเลี่ยง)',
    gradeTextColor: '#D83829',
    sugarLevelText: 'ค่าน้ำตาลมากกว่า 20 ‼️',
    sugarDescription1: 'ขึ้นเร็ว ',
    sugarDescription2: 'ควรงดหรือหลีกเลี่ยงค่ะ',
    suggest_preset: [
      'เมนูนี้อาจไม่เหมาะกับการทานบ่อยนักนะคะ',
      'เป็นเมนูที่ควรระวังปริมาณและความถี่ในการทานค่ะ',
      'ลองค่อย ๆ ปรับลดการเลือกเมนูนี้ดูนะคะ',
      'เมนูนี้ควรหลีกเลี่ยงหากเป็นไปได้นะคะ เพื่อดูแลสุขภาพในระยะยาวค่ะ',
      'เมนูนี้ไม่เหมาะกับการทานบ่อย ๆ ลองสลับเป็นเมนูอื่นแทนค่ะ',
      'หากเลี่ยงได้ จะช่วยให้ดูแลสุขภาพได้ดีขึ้นในแต่ละวันค่ะ',
      'เมนูนี้ควรทานให้น้อยที่สุด และแนะนำให้มีตัวเลือกที่หลากหลายขึ้นค่ะ',
      'หากหลีกเลี่ยงเมนูนี้ได้ จะเป็นประโยชน์ต่อสุขภาพโดยรวมค่ะ',
      'เมนูนี้ควรลดหรือหลีกเลี่ยง และลองเลือกเมนูที่ส่งเสริมสุขภาพมากขึ้นค่ะ',
    ],
  },
};

export const GradingFlex = (
  menuGrade: Grade,
  menuName: string,
): messagingApi.FlexMessage => {
  return {
    type: 'flex',
    altText: 'giving grade to user',
    contents: {
      type: 'bubble',
      size: 'mega',
      hero: imagePart(menuGrade),
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          menuNamePart(menuName),
          {
            type: 'separator',
            margin: 'lg',
          },
          gradePart(menuGrade),
        ],
        paddingBottom: 'xxl',
        paddingTop: 'xl',
        paddingAll: 'none',
        paddingStart: 'lg',
        paddingEnd: 'lg',
        position: 'relative',
      },
    },
  };
};



const imagePart = (menuGrade: Grade): messagingApi.FlexComponent => {
  return {
    type: 'image',
    url: GradeInfo2[menuGrade].imageUrl,
    aspectRatio: '2:1',
    aspectMode: 'fit',
    size: 'full',
  };
};

const menuNamePart = (menuName: string): messagingApi.FlexComponent => {
  return {
    type: 'box',
    layout: 'vertical',
    contents: [
      {
        type: 'text',
        text: menuName,
        size: 'lg',
        wrap: true,
        weight: 'bold',
        align: 'center',
        scaling: true,
      },
    ],
    paddingBottom: 'sm',
  };
};

const gradePart = (menuGrade: Grade): messagingApi.FlexComponent => {
  return {
    type: 'box',
    layout: 'vertical',
    contents: [
      showGradeTextPart(menuGrade),
      sugarLevelPart(menuGrade),
      sugarDescriptionPart(menuGrade),
      suggestionPart(menuGrade),
    ],
    paddingTop: 'none',
    paddingBottom: 'xxl',
    paddingStart: 'md',
    paddingAll: 'none',
    paddingEnd: 'md',
  };
};

const showGradeTextPart = (menuGrade: Grade): messagingApi.FlexComponent => {
  const { gradeText, gradeTextColor } = GradeInfo2[menuGrade];
  return {
    type: 'text',
    text: gradeText,
    offsetTop: 'none',
    weight: 'bold',
    margin: 'lg',
    wrap: true,
    color: gradeTextColor,
    size: '20px',
  };
};

const sugarLevelPart = (menuGrade: Grade): messagingApi.FlexComponent => {
  const { sugarLevelText, backgroundColor, borderColor } =
    GradeInfo2[menuGrade];
  return {
    type: 'box',
    layout: 'vertical',
    contents: [
      {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: sugarLevelText,
            size: '18px',
            align: 'center',
          },
        ],
        paddingTop: 'md',
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        borderWidth: 'medium',
        cornerRadius: '12px',
        paddingBottom: 'md',
        width: '200px',
        justifyContent: 'center',
        alignItems: 'center',
      },
    ],
    alignItems: 'center',
    offsetTop: 'lg',
  };
};

const sugarDescriptionPart = (menuGrade: Grade): messagingApi.FlexComponent => {
  const { sugarDescription1, sugarDescription2 } = GradeInfo2[menuGrade];
  return {
    type: 'text',
    wrap: true,
    size: '18px',
    offsetTop: '22px',
    contents: [
      {
        type: 'span',
        text: 'น้ำตาลในเลือด',
      },
      {
        type: 'span',
        text: sugarDescription1,
        weight: 'bold',
      },
      {
        type: 'span',
        text: sugarDescription2,
      },
    ],
  };
};

const suggestionPart = (menuGrade: Grade): messagingApi.FlexComponent => {
  return {
    type: 'text',
    margin: 'xxl',
    weight: 'bold',
    contents: [
      {
        type: 'span',
        text: 'ข้อแนะนำ : ',
        size: '18px',
        color: '#57564F',
      },
      {
        type: 'span',
        text: randomSuggest(menuGrade),
        weight: 'regular',
        size: '18px',
        color: '#57564F',
      },
    ],
    wrap: true,
    offsetTop: 'xxl',
    offsetBottom: 'none',
  };
};

