import { Request, Response } from 'express';
import { createShortUrl, getOriginalUrl, getUrlStats } from '../services/url.service';

export async function shortenUrl(req: Request, res: Response): Promise<void> {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  try {
    new URL(url);
  } catch {
    res.status(400).json({ error: 'Invalid URL format' });
    return;
  }

  try {
    const shortCode = await createShortUrl(url);
    const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;

    res.status(201).json({
      shortCode,
      shortUrl,
      originalUrl: url,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create short URL' });
  }
}

export async function redirectUrl(req: Request, res: Response): Promise<void> {
  const shortCode = req.params.shortCode as string;

  try {
    const originalUrl = await getOriginalUrl(shortCode);

    if (!originalUrl) {
      res.status(404).json({ error: 'URL not found' });
      return;
    }

    res.redirect(301, originalUrl);
  } catch (error) {
    res.status(500).json({ error: 'Failed to redirect' });
  }
}

export async function getStats(req: Request, res: Response): Promise<void> {
  const shortCode = req.params.shortCode as string;

  try {
    const stats = await getUrlStats(shortCode);

    if (!stats) {
      res.status(404).json({ error: 'URL not found' });
      return;
    }

    res.json({
      shortCode: stats.short_code,
      originalUrl: stats.original_url,
      clickCount: stats.click_count,
      createdAt: stats.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
}
