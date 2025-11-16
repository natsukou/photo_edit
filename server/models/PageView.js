const { pool } = require('../config/database');

class PageView {
  /**
   * 记录页面访问
   */
  static async create(pageViewData) {
    const {
      user_id,
      session_id,
      page_name,
      previous_page,
      duration,
      device_type,
      browser,
      os,
      screen_resolution,
      referrer
    } = pageViewData;

    const sql = `
      INSERT INTO page_views 
      (user_id, session_id, page_name, previous_page, duration, 
       device_type, browser, os, screen_resolution, referrer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await pool.execute(sql, [
        user_id,
        session_id,
        page_name,
        previous_page,
        duration,
        device_type,
        browser,
        os,
        screen_resolution,
        referrer
      ]);
      return { success: true, id: result.insertId };
    } catch (error) {
      console.error('记录页面访问失败:', error);
      throw error;
    }
  }

  /**
   * 批量记录页面访问
   */
  static async createBatch(pageViews) {
    if (!pageViews || pageViews.length === 0) return { success: true, count: 0 };

    const sql = `
      INSERT INTO page_views 
      (user_id, session_id, page_name, previous_page, duration, 
       device_type, browser, os, screen_resolution, referrer)
      VALUES ?
    `;

    const values = pageViews.map(pv => [
      pv.user_id,
      pv.session_id,
      pv.page_name,
      pv.previous_page,
      pv.duration,
      pv.device_type,
      pv.browser,
      pv.os,
      pv.screen_resolution,
      pv.referrer
    ]);

    try {
      const [result] = await pool.query(sql, [values]);
      return { success: true, count: result.affectedRows };
    } catch (error) {
      console.error('批量记录页面访问失败:', error);
      throw error;
    }
  }

  /**
   * 获取今日DAU
   */
  static async getTodayDAU() {
    const sql = `
      SELECT COUNT(DISTINCT user_id) as dau
      FROM page_views
      WHERE DATE(created_time) = CURDATE()
    `;
    try {
      const [rows] = await pool.execute(sql);
      return rows[0].dau || 0;
    } catch (error) {
      console.error('获取DAU失败:', error);
      throw error;
    }
  }
}

module.exports = PageView;
