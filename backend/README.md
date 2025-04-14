# TensorBoard集成

这个后端服务提供了将流程图生成的模型结构转换为TensorBoard可视化的功能。

## 运行步骤

1. 安装Node.js依赖：

```bash
cd backend
npm install
```

2. 启动后端服务：

```bash
npm run dev
```

服务将在端口5001上运行。

## TensorBoard功能

当用户在前端页面中点击"查看TensorBoard"按钮时，服务将：

1. 从前端接收模型结构数据
2. 自动设置Python虚拟环境（如果尚未设置）
3. 转换模型结构为TensorFlow模型
4. 进行模拟训练并生成TensorBoard日志
5. 启动TensorBoard服务（默认在端口6006上）
6. 通知用户在浏览器中打开http://localhost:6006访问TensorBoard

## 技术细节

- 使用Node.js的child_process模块管理Python进程和TensorBoard服务
- 自动创建和管理Python虚拟环境
- 使用TensorFlow.js的模型结构转换为TensorFlow Python模型
- 支持所有常见的神经网络层类型 