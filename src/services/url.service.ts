import pool from '../config/database';
import { encode } from '../utils/base62';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

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

  return shortCode;
}

export async function getOriginalUrl(shortCode: string): Promise<string | null> {
  const [rows] = await pool.query<UrlRow[]>(
    'SELECT original_url FROM urls WHERE short_code = ?',
    [shortCode]
  );

  if (rows.length === 0) return null;

  await pool.query('UPDATE urls SET click_count = click_count + 1 WHERE short_code = ?', [shortCode]);

  return rows[0].original_url;
}

export async function getUrlStats(shortCode: string): Promise<UrlRow | null> {
  const [rows] = await pool.query<UrlRow[]>(
    'SELECT * FROM urls WHERE short_code = ?',
    [shortCode]
  );

  return rows.length > 0 ? rows[0] : null;
}
