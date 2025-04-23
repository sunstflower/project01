#!/bin/bash

# 查找运行在5001端口的进程并终止
echo "检查5001端口..."
PID=$(lsof -t -i:5001)
if [ ! -z "$PID" ]; then
  echo "终止端口5001上的进程: $PID"
  kill -9 $PID
else
  echo "端口5001没有运行中的进程"
fi

# 确保temp和logs目录存在
mkdir -p temp
mkdir -p logs
mkdir -p tb_logs

# 启动服务器
echo "启动TensorBoard后端服务..."
npm run dev 