// 阿里云函数计算3.0入口文件
const app = require('./server');

// 🔥 FC3.0 HTTP函数入口
module.exports.handler = async (event, context) => {
  console.log('📦 收到请求:');
  console.log('  Event:', JSON.stringify(event, null, 2));
  console.log('  Context:', JSON.stringify(context, null, 2));
  
  // 转换 FC 事件为 Express 请求
  const serverless = require('serverless-http');
  const handler = serverless(app);
  const result = await handler(event, context);
  
  console.log('✅ 返回响应:');
  console.log('  Result:', JSON.stringify(result, null, 2));
  
  return result;
};
