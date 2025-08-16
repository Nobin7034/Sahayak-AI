import express from 'express';
import News from '../models/News.js';

const router = express.Router();

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

// Get news by ID and increment view count
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const news = await News.findById(id);
    if (!news || !news.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    // Increment view count
    news.viewCount += 1;
    await news.save();

    res.json({
      success: true,
      data: news
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

// Get latest news (for homepage)
router.get('/latest/:count', async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 5;
    
    const news = await News.find({ isPublished: true })
      .select('title summary publishDate category')
      .sort({ publishDate: -1 })
      .limit(count);

    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Get latest news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest news',
      error: error.message
    });
  }
});

export default router;