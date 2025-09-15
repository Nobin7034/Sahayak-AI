import express from 'express';
import News from '../models/News.js';
import Parser from 'rss-parser';
import axios from 'axios';

const router = express.Router();
const rssParser = new Parser();

// Get all published news
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category;

    let query = { isPublished: true };
    if (category) {
      query.category = category;
    }

    const news = await News.find(query)
      .select('-createdBy')
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalNews = await News.countDocuments(query);

    res.json({
      success: true,
      data: {
        news,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalNews / limit),
          totalNews,
          hasNext: page < Math.ceil(totalNews / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news',
      error: error.message
    });
  }
});

// Get latest news (for homepage) - place BEFORE :id route to avoid conflicts
router.get('/latest/:count', async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 5;
    const news = await News.find({ isPublished: true })
      .select('title summary publishDate category imageUrl imageAlt')
      .sort({ publishDate: -1 })
      .limit(count);

    res.json({ success: true, data: news });
  } catch (error) {
    console.error('Get latest news error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch latest news', error: error.message });
  }
});

// Get news by ID and increment view count
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);
    if (!news || !news.isPublished) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }
    news.viewCount += 1;
    await news.save();
    res.json({ success: true, data: news });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch news', error: error.message });
  }
});

// External Kerala Govt News Proxy
router.get('/external/kerala', async (req, res) => {
  try {
    const { source = 'rss', limit = 10 } = req.query;

    // Option A: RSS feeds (default, no API key)
    if (source === 'rss') {
      const feeds = [
        'https://www.kerala.gov.in/documents/10180/6989130?format=rss', // Kerala Govt portal (if RSS available)
        'https://prsindia.org/media/press-releases/rss.xml', // PRS press releases (national), can filter title contains Kerala
        'https://www.thehindu.com/news/national/kerala/feeder/default.rss'
      ];
      const items = [];
      for (const url of feeds) {
        try {
          const feed = await rssParser.parseURL(url);
          feed.items.forEach(it => items.push({
            title: it.title,
            summary: it.contentSnippet || it.content || '',
            link: it.link,
            publishDate: it.isoDate || it.pubDate,
            imageUrl: it.enclosure?.url || '',
            source: feed.title
          }));
        } catch (e) {
          // Skip failing feed
          console.warn('RSS fetch failed:', url, e.message);
        }
      }
      // Basic filter for Kerala keyword if needed
      const filtered = items.filter(i => /kerala/i.test(i.title + ' ' + i.summary)).slice(0, Number(limit));
      return res.json({ success: true, data: filtered });
    }

    // Option B: NewsAPI (needs NEWS_API_KEY)
    if (source === 'newsapi') {
      const apiKey = process.env.NEWS_API_KEY;
      if (!apiKey) return res.status(400).json({ success: false, message: 'NEWS_API_KEY not configured' });
      const url = `https://newsapi.org/v2/everything?q=kerala%20government&sortBy=publishedAt&language=en&pageSize=${limit}`;
      const { data } = await axios.get(url, { headers: { 'X-Api-Key': apiKey } });
      const mapped = (data.articles || []).map(a => ({
        title: a.title,
        summary: a.description,
        link: a.url,
        publishDate: a.publishedAt,
        imageUrl: a.urlToImage || ''
      }));
      return res.json({ success: true, data: mapped });
    }

    return res.status(400).json({ success: false, message: 'Unsupported source' });
  } catch (error) {
    console.error('External news fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch external news', error: error.message });
  }
});

export default router;