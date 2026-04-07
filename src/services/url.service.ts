import pool from '../config/database';
import redis from '../config/redis';
import { encode } from '../utils/base62';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const CACHE_TTL = 3600; // 1시간

interface UrlRow extends RowDataPacket {
  id: number;
  short_code: string;
  original_url: string;
  click_count: number;
  created_at: Date;
}

export async function createShortUrl(originalUrl: string): Promise<string> {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO urls (short_code, original_url) VALUES (?, ?)',
    ['temp', originalUrl]
  );

  const shortCode = encode(result.insertId);

  await pool.query('UPDATE urls SET short_code = ? WHERE id = ?', [shortCode, result.insertId]);

  // 생성 시 캐시에 미리 저장
  await redis.set(`url:${shortCode}`, originalUrl, 'EX', CACHE_TTL);

  return shortCode;
}

export async function getOriginalUrl(shortCode: string): Promise<string | null> {
  // 1. Redis 캐시 먼저 확인
  const cached = await redis.get(`url:${shortCode}`);
  if (cached) {
    // 클릭 카운트는 비동기로 업데이트 (응답 속도에 영향 없음)
    pool.query('UPDATE urls SET click_count = click_count + 1 WHERE short_code = ?', [shortCode]);
    return cached;
  }

  // 2. 캐시 미스 → DB 조회
  const [rows] = await pool.query<UrlRow[]>(
    'SELECT original_url FROM urls WHERE short_code = ?',
    [shortCode]
  );

  if (rows.length === 0) return null;

  const originalUrl = rows[0].original_url;

  // 3. 캐시에 저장
  await redis.set(`url:${shortCode}`, originalUrl, 'EX', CACHE_TTL);

  // 4. 클릭 카운트 업데이트
  pool.query('UPDATE urls SET click_count = click_count + 1 WHERE short_code = ?', [shortCode]);

  return originalUrl;
}

export async function getUrlStats(shortCode: string): Promise<UrlRow | null> {
  const [rows] = await pool.query<UrlRow[]>(
    'SELECT * FROM urls WHERE short_code = ?',
    [shortCode]
  );

  return rows.length > 0 ? rows[0] : null;
}
