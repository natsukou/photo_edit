// 阿里云函数计算入口文件
const serverless = require('serverless-http');
const app = require('./server');

// 导出函数计算handler
module.exports.handler = serverless(app);
