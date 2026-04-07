const CHARACTERS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = CHARACTERS.length;

export function encode(num: number): string {
  if (num === 0) return CHARACTERS[0];

  let result = '';
  while (num > 0) {
    result = CHARACTERS[num % BASE] + result;
    num = Math.floor(num / BASE);
  }
  return result;
}

export function decode(str: string): number {
  let result = 0;
  for (const char of str) {
    result = result * BASE + CHARACTERS.indexOf(char);
  }
  return result;
}
