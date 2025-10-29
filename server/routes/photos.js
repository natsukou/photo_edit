const express = require('express');
const router = express.Router();
const PhotoRecord = require('../models/PhotoRecord');
const GuideUsage = require('../models/GuideUsage');

/**
 * POST /api/photos
 * 创建照片记录
 */
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      photo_url,
      photo_size,
      photo_width,
      photo_height,
      category,
      style,
      custom_description
    } = req.body;

    const result = await PhotoRecord.create({
      user_id,
      photo_url,
      photo_size,
      photo_width,
      photo_height,
      category,
      style,
      custom_description
    });

    res.json({
      code: 0,
      message: 'success',
      data: {
        photo_id: result.photo_id
      }
    });
  } catch (error) {
    console.error('创建照片记录失败:', error);
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * GET /api/photos/user/:user_id
 * 获取用户的照片记录
 */
router.get('/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const photos = await PhotoRecord.getByUserId(user_id, limit);

    res.json({
      code: 0,
      message: 'success',
      data: photos
    });
  } catch (error) {
    console.error('获取照片记录失败:', error);
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * GET /api/photos/popular
 * 获取热门题材和风格
 */
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const popular = await PhotoRecord.getPopularCategoryStyle(limit);

    res.json({
      code: 0,
      message: 'success',
      data: popular
    });
  } catch (error) {
    console.error('获取热门题材失败:', error);
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * POST /api/photos/:photo_id/guide-usage
 * 记录辅助线使用
 */
router.post('/:photo_id/guide-usage', async (req, res) => {
  try {
    const { photo_id } = req.params;
    const {
      user_id,
      grid_enabled,
      golden_enabled,
      diagonal_enabled,
      center_enabled,
      downloaded,
      view_duration
    } = req.body;

    const result = await GuideUsage.create({
      photo_id: parseInt(photo_id),
      user_id,
      grid_enabled,
      golden_enabled,
      diagonal_enabled,
      center_enabled,
      downloaded,
      view_duration
    });

    res.json({
      code: 0,
      message: 'success',
      data: result
    });
  } catch (error) {
    console.error('记录辅助线使用失败:', error);
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * POST /api/photos/:photo_id/download
 * 更新下载状态
 */
router.post('/:photo_id/download', async (req, res) => {
  try {
    const { photo_id } = req.params;
    const { user_id } = req.body;

    await GuideUsage.updateDownload(parseInt(photo_id), user_id);

    res.json({
      code: 0,
      message: 'success'
    });
  } catch (error) {
    console.error('更新下载状态失败:', error);
    res.status(500).json({
      code: -1,
      message: '服务器错误',
      error: error.message
    });
  }
});

module.exports = router;
