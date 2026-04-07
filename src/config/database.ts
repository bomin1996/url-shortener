import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'url_shortener',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function initDatabase(): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS urls (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        short_code VARCHAR(10) NOT NULL UNIQUE,
        original_url TEXT NOT NULL,
        click_count BIGINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_short_code (short_code)
      )
    `);
    console.log('Database initialized');
  } finally {
    connection.release();
  }
}

export default pool;
