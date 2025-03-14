export const convertPersianToEnglishNumbers = (str: string): string => {
  if (!str) return str;
  
  // نگاشت اعداد فارسی و عربی به انگلیسی
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  // تبدیل اعداد فارسی به انگلیسی
  let result = str;
  for (let i = 0; i < 10; i++) {
    const persianRegex = new RegExp(persianDigits[i], 'g');
    const arabicRegex = new RegExp(arabicDigits[i], 'g');
    
    result = result
      .replace(persianRegex, englishDigits[i])
      .replace(arabicRegex, englishDigits[i]);
  }
  
  return result;
}; 