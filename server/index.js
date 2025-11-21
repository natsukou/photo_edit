// 阿里云函数计算3.0入口文件
const app = require('./server');

// 🔥 FC3.0 HTTP函数入口
module.exports.handler = async (event, context) => {
  // 转换 FC 事件为 Express 请求
  const serverless = require('serverless-http');
  const handler = serverless(app);
  return await handler(event, context);
};
