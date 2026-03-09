const removeVietnameseTones = (str: string): string => {
   return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .toLowerCase()
      .trim();
};


export const generateUsernameSuggestions = (fullName: string, count: number = 5): string[] => {
   if (!fullName) return [];

   const cleanName = removeVietnameseTones(fullName);
   const words = cleanName.split(' ').filter((w) => w.length > 0);

   // Rút ngắn baseString nếu quá dài (giới hạn 12 ký tự)
   let baseString = words.join('');
   if (baseString.length > 12) {
      baseString = baseString.substring(0, 12);
   }

   if (!baseString) return [];

   const suggestions = new Set<string>();

   // Pattern với dấu chấm và gạch dưới (chỉ nếu ngắn)
   if (words.length > 1) {
      const dotPattern = words.join('.');
      const underscorePattern = words.join('_');

      if (dotPattern.length <= 15) suggestions.add(dotPattern);
      if (underscorePattern.length <= 15) suggestions.add(underscorePattern);

      // Tên + họ rút gọn (ví dụ: hungnt thay vì hung.nguyenthanh)
      const firstName = words[words.length - 1];
      const initials = words.slice(0, words.length - 1).map(w => w[0]).join('');
      const shortPattern = `${firstName}${initials}`;
      if (shortPattern.length <= 15) suggestions.add(shortPattern);
   }

   // Số ngẫu nhiên ngắn (1-2 chữ số)
   const randomNum1 = Math.floor(Math.random() * 99);
   const randomNum2 = Math.floor(Math.random() * 999);

   if (`${baseString}${randomNum1}`.length <= 15) {
      suggestions.add(`${baseString}${randomNum1}`);
   }
   if (`${baseString}_${randomNum2}`.length <= 15) {
      suggestions.add(`${baseString}_${randomNum2}`);
   }

   // Prefix/suffix ngắn gọn
   const prefixes = ['i_', 'the_', 'im_'];
   const suffixes = ['_x', '_z', '_v'];

   const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
   const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];

   if (`${randomPrefix}${baseString}`.length <= 15) {
      suggestions.add(`${randomPrefix}${baseString}`);
   }
   if (`${baseString}${randomSuffix}`.length <= 15) {
      suggestions.add(`${baseString}${randomSuffix}`);
   }


   if (words.length >= 2) {
      const first = words[0].substring(0, 4);
      const last = words[words.length - 1].substring(0, 4);
      if (`${first}_${last}`.length <= 15) {
         suggestions.add(`${first}_${last}`);
      }
   }

   return Array.from(suggestions)
      .filter((username) => username.length >= 3 && username.length <= 15)
      .slice(0, count);
};