const express = require('express');
const cors = require('cors');
const path = require('path');
const { json, urlencoded } = require('body-parser');
const http = require('http');

// 导入路由
let tensorboardRoutes;
try {
  tensorboardRoutes = require('./tensorboard');
  console.log('TensorBoard路由加载成功');
} catch (error) {
  console.error('TensorBoard路由加载失败:', error);
  // 提供一个空路由作为后备
  tensorboardRoutes = express.Router();
  tensorboardRoutes.post('/prepare', (req, res) => {
    res.status(500).json({ success: false, error: '后端模块加载失败' });
  });
}

const app = express();
const PORT = process.env.PORT || 5001;

// 中间件
app.use(cors());
app.use(json({ limit: '50mb' }));
app.use(urlencoded({ extended: true, limit: '50mb' }));

// 简单的健康检查路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器正常运行' });
});

// 挂载TensorBoard路由
app.use('/api/tensorboard', tensorboardRoutes);

// 创建HTTP服务器而不是直接使用app.listen
const server = http.createServer(app);

// 存储当前活跃连接
let connections = [];

// 跟踪连接
server.on('connection', connection => {
  connections.push(connection);
  connection.on('close', () => {
    connections = connections.filter(curr => curr !== connection);
  });
});

// 优雅关闭函数
function shutDown() {
  console.log('正在关闭服务器...');
  
  // 关闭服务器，停止接受新连接
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
  
  // 强制关闭连接的超时时间
  setTimeout(() => {
    console.log('强制关闭连接');
    process.exit(1);
  }, 10000);
  
  // 关闭现有连接
  connections.forEach(conn => conn.end());
  setTimeout(() => {
    connections.forEach(conn => conn.destroy());
  }, 5000);
}

// 监听中断信号
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

// 启动服务器
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
}); 