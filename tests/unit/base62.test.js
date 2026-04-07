"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base62_1 = require("../../src/utils/base62");
describe('Base62', () => {
    describe('encode', () => {
        it('0을 인코딩하면 "0"을 반환한다', () => {
            expect((0, base62_1.encode)(0)).toBe('0');
        });
        it('양수를 Base62로 인코딩한다', () => {
            expect((0, base62_1.encode)(1)).toBe('1');
            expect((0, base62_1.encode)(10)).toBe('a');
            expect((0, base62_1.encode)(36)).toBe('A');
            expect((0, base62_1.encode)(62)).toBe('10');
        });
        it('큰 숫자도 짧은 코드로 인코딩한다', () => {
            const result = (0, base62_1.encode)(1000000);
            expect(result.length).toBeLessThanOrEqual(4);
        });
    });
    describe('decode', () => {
        it('인코딩된 문자열을 원래 숫자로 디코딩한다', () => {
            expect((0, base62_1.decode)('0')).toBe(0);
            expect((0, base62_1.decode)('1')).toBe(1);
            expect((0, base62_1.decode)('a')).toBe(10);
            expect((0, base62_1.decode)('A')).toBe(36);
            expect((0, base62_1.decode)('10')).toBe(62);
        });
    });
    describe('encode/decode 일관성', () => {
        it('encode 후 decode하면 원래 값이 나온다', () => {
            const testValues = [0, 1, 10, 100, 1000, 999999, 56800235583];
            for (const value of testValues) {
                expect((0, base62_1.decode)((0, base62_1.encode)(value))).toBe(value);
            }
        });
        it('연속된 ID는 서로 다른 코드를 생성한다', () => {
            const codes = new Set();
            for (let i = 1; i <= 1000; i++) {
                codes.add((0, base62_1.encode)(i));
            }
            expect(codes.size).toBe(1000);
        });
    });
});
