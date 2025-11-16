const { pool } = require('../config/database');

class PhotoRecord {
  /**
   * 创建照片记录
   */
  static async create(photoData) {
    const {
      user_id,
      photo_url,
      photo_size,
      photo_width,
      photo_height,
      category,
      style,
      custom_description
    } = photoData;

    const sql = `
      INSERT INTO photo_records 
      (user_id, photo_url, photo_size, photo_width, photo_height, category, style, custom_description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await pool.execute(sql, [
        user_id,
        photo_url,
        photo_size,
        photo_width,
        photo_height,
        category,
        style,
        custom_description
      ]);
      return { success: true, photo_id: result.insertId };
    } catch (error) {
      console.error('创建照片记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的照片记录
   */
  static async getByUserId(user_id, limit = 10) {
    const sql = `
      SELECT * FROM photo_records 
      WHERE user_id = ? 
      ORDER BY created_time DESC 
      LIMIT ?
    `;
    try {
      const [rows] = await pool.execute(sql, [user_id, limit]);
      return rows;
    } catch (error) {
      console.error('获取照片记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取热门题材和风格
   */
  static async getPopularCategoryStyle(limit = 20) {
    const sql = `
      SELECT category, style, COUNT(*) as usage_count
      FROM photo_records
      WHERE created_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY category, style
      ORDER BY usage_count DESC
      LIMIT ?
    `;
    try {
      const [rows] = await pool.execute(sql, [limit]);
      return rows;
    } catch (error) {
      console.error('获取热门题材失败:', error);
      throw error;
    }
  }
}

module.exports = PhotoRecord;
