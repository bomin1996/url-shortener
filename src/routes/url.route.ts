import { Router } from 'express';
import { shortenUrl, getStats } from '../controllers/url.controller';
import { createLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @swagger
 * /api/shorten:
 *   post:
 *     summary: URL 단축 생성
 *     description: 원본 URL을 받아 단축 URL을 생성합니다
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 example: "https://www.example.com/very/long/url"
 *     responses:
 *       201:
 *         description: 단축 URL 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shortCode:
 *                   type: string
 *                   example: "1a"
 *                 shortUrl:
 *                   type: string
 *                   example: "http://localhost:3000/1a"
 *                 originalUrl:
 *                   type: string
 *                   example: "https://www.example.com/very/long/url"
 *       400:
 *         description: 잘못된 요청 (URL 누락 또는 형식 오류)
 */
router.post('/api/shorten', createLimiter, shortenUrl);

/**
 * @swagger
 * /api/stats/{shortCode}:
 *   get:
 *     summary: URL 통계 조회
 *     description: 단축 URL의 클릭 수 등 통계를 조회합니다
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *         description: 단축 코드
 *     responses:
 *       200:
 *         description: 통계 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shortCode:
 *                   type: string
 *                 originalUrl:
 *                   type: string
 *                 clickCount:
 *                   type: number
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: URL을 찾을 수 없음
 */
router.get('/api/stats/:shortCode', getStats);

export default router;
