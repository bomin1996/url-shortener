"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../src/app"));
const database_1 = __importDefault(require("../../src/config/database"));
const redis_1 = __importDefault(require("../../src/config/redis"));
const database_2 = require("../../src/config/database");
beforeAll(async () => {
    await (0, database_2.initDatabase)();
    // 테스트 시작 전 테이블 비우기
    await database_1.default.query('DELETE FROM urls');
    await redis_1.default.flushdb();
});
afterAll(async () => {
    await database_1.default.end();
    await redis_1.default.quit();
});
describe('POST /api/shorten', () => {
    it('유효한 URL을 단축한다', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/shorten')
            .send({ url: 'https://www.google.com' });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('shortCode');
        expect(res.body).toHaveProperty('shortUrl');
        expect(res.body.originalUrl).toBe('https://www.google.com');
    });
    it('URL 없이 요청하면 400을 반환한다', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/shorten')
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('URL is required');
    });
    it('잘못된 URL 형식이면 400을 반환한다', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/shorten')
            .send({ url: 'not-a-valid-url' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid URL format');
    });
});
describe('GET /:shortCode', () => {
    let shortCode;
    beforeAll(async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/shorten')
            .send({ url: 'https://www.naver.com' });
        shortCode = res.body.shortCode;
    });
    it('존재하는 short code로 요청하면 301 리다이렉트한다', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/${shortCode}`)
            .redirects(0);
        expect(res.status).toBe(301);
        expect(res.headers.location).toBe('https://www.naver.com');
    });
    it('존재하지 않는 short code로 요청하면 404를 반환한다', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/nonexistent');
        expect(res.status).toBe(404);
    });
    it('같은 URL을 여러 번 조회하면 캐시에서 응답한다', async () => {
        // 첫 번째 요청 (DB 조회 → 캐시 저장)
        await (0, supertest_1.default)(app_1.default).get(`/${shortCode}`).redirects(0);
        // Redis에 캐시되어 있는지 확인
        const cached = await redis_1.default.get(`url:${shortCode}`);
        expect(cached).toBe('https://www.naver.com');
        // 두 번째 요청 (캐시에서 응답)
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/${shortCode}`)
            .redirects(0);
        expect(res.status).toBe(301);
    });
});
describe('GET /api/stats/:shortCode', () => {
    let shortCode;
    beforeAll(async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/shorten')
            .send({ url: 'https://www.github.com' });
        shortCode = res.body.shortCode;
    });
    it('URL 통계를 반환한다', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/stats/${shortCode}`);
        expect(res.status).toBe(200);
        expect(res.body.shortCode).toBe(shortCode);
        expect(res.body.originalUrl).toBe('https://www.github.com');
        expect(res.body.clickCount).toBe(0);
        expect(res.body).toHaveProperty('createdAt');
    });
    it('클릭 후 카운트가 증가한다', async () => {
        // 리다이렉트 3번
        await (0, supertest_1.default)(app_1.default).get(`/${shortCode}`).redirects(0);
        await (0, supertest_1.default)(app_1.default).get(`/${shortCode}`).redirects(0);
        await (0, supertest_1.default)(app_1.default).get(`/${shortCode}`).redirects(0);
        // 비동기 업데이트 대기
        await new Promise((resolve) => setTimeout(resolve, 100));
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/stats/${shortCode}`);
        expect(res.body.clickCount).toBe(3);
    });
    it('존재하지 않는 short code의 통계를 요청하면 404를 반환한다', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/stats/nonexistent');
        expect(res.status).toBe(404);
    });
});
