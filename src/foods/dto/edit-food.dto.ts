export class EditFoodDto {
  id: number;
  name: string;
  description: string;
  grade: 'A' | 'B' | 'C';
  grading_by_ai: boolean;
  is_confirmed: boolean;
  is_rejected: boolean;
  category?: 'อาหาร-ของว่าง' | 'เครื่องดื่ม' | 'ผลไม้' | 'ธัญพืช';
}
