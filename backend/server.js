const express = require('express');
const cors = require('cors');
const path = require('path');
const { json, urlencoded } = require('body-parser');

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

// 路由
app.use('/api/tensorboard', tensorboardRoutes);

// 简单的健康检查路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器正常运行' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
}); 