const { pool } = require('../config/database');

class GuideUsage {
  /**
   * 记录辅助线使用
   */
  static async create(guideData) {
    const {
      photo_id,
      user_id,
      grid_enabled = false,
      golden_enabled = false,
      diagonal_enabled = false,
      center_enabled = false,
      downloaded = false,
      view_duration
    } = guideData;

    const sql = `
      INSERT INTO guide_usage 
      (photo_id, user_id, grid_enabled, golden_enabled, diagonal_enabled, 
       center_enabled, downloaded, view_duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await pool.execute(sql, [
        photo_id,
        user_id,
        grid_enabled ? 1 : 0,
        golden_enabled ? 1 : 0,
        diagonal_enabled ? 1 : 0,
        center_enabled ? 1 : 0,
        downloaded ? 1 : 0,
        view_duration
      ]);
      return { success: true, id: result.insertId };
    } catch (error) {
      console.error('记录辅助线使用失败:', error);
      throw error;
    }
  }

  /**
   * 更新下载状态
   */
  static async updateDownload(photo_id, user_id) {
    const sql = `
      UPDATE guide_usage 
      SET downloaded = 1 
      WHERE photo_id = ? AND user_id = ?
    `;
    try {
      await pool.execute(sql, [photo_id, user_id]);
      return { success: true };
    } catch (error) {
      console.error('更新下载状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取下载转化率
   */
  static async getDownloadRate() {
    const sql = `
      SELECT 
        COUNT(*) as total_usage,
        SUM(downloaded) as downloads,
        ROUND(SUM(downloaded) * 100.0 / COUNT(*), 2) as conversion_rate
      FROM guide_usage
      WHERE created_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    try {
      const [rows] = await pool.execute(sql);
      return rows[0];
    } catch (error) {
      console.error('获取下载转化率失败:', error);
      throw error;
    }
  }
}

module.exports = GuideUsage;
