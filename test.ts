export const getNextLetterNumber = (letters: any[]) => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const prefix = `SR31/WA/${month}/${year}/`;
    let maxNum = 0;
    letters.forEach(letter => {
      if (letter.letterNumber && letter.letterNumber.startsWith(prefix)) {
        const parts = letter.letterNumber.split('/');
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = String(maxNum + 1).padStart(3, '0');
    return `${prefix}${nextNum}`;
};
