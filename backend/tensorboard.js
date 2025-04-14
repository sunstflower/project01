const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// TensorBoard进程引用
let tensorboardProcess = null;

// 准备虚拟环境的路径
const venvPath = path.join(__dirname, 'venv');
const venvBin = process.platform === 'win32' 
  ? path.join(venvPath, 'Scripts') 
  : path.join(venvPath, 'bin');

// 检查虚拟环境是否存在
const checkVenv = () => {
  const venvExists = fs.existsSync(venvPath);
  const venvBinExists = fs.existsSync(venvBin);
  
  return venvExists && venvBinExists;
};

// 创建虚拟环境
const createVenv = () => {
  return new Promise((resolve, reject) => {
    console.log('创建Python虚拟环境...');
    
    // 使用python -m venv命令创建虚拟环境
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const venvProcess = spawn(pythonCmd, ['-m', 'venv', venvPath]);
    
    venvProcess.stdout.on('data', (data) => {
      console.log(`venv stdout: ${data}`);
    });
    
    venvProcess.stderr.on('data', (data) => {
      console.error(`venv stderr: ${data}`);
    });
    
    venvProcess.on('close', (code) => {
      if (code === 0) {
        console.log('虚拟环境创建成功');
        resolve();
      } else {
        console.error(`虚拟环境创建失败，错误代码: ${code}`);
        reject(new Error(`虚拟环境创建失败，错误代码: ${code}`));
      }
    });
  });
};

// 安装依赖包
const installDependencies = () => {
  return new Promise((resolve, reject) => {
    console.log('安装Python依赖...');
    
    // 构建pip命令路径
    const pipCmd = process.platform === 'win32' 
      ? path.join(venvBin, 'pip.exe') 
      : path.join(venvBin, 'pip');
    
    // 检查requirements.txt是否存在
    const requirementsPath = path.join(__dirname, 'requirements.txt');
    if (!fs.existsSync(requirementsPath)) {
      // 如果不存在，创建一个
      fs.writeFileSync(requirementsPath, 'tensorflow>=2.4.0\nnumpy>=1.19.2\n');
    }
    
    // 运行pip install命令
    const pipProcess = spawn(pipCmd, ['install', '-r', requirementsPath]);
    
    pipProcess.stdout.on('data', (data) => {
      console.log(`pip stdout: ${data}`);
    });
    
    pipProcess.stderr.on('data', (data) => {
      console.error(`pip stderr: ${data}`);
    });
    
    pipProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Python依赖安装成功');
        resolve();
      } else {
        console.error(`Python依赖安装失败，错误代码: ${code}`);
        reject(new Error(`Python依赖安装失败，错误代码: ${code}`));
      }
    });
  });
};

// 确保Python环境已准备就绪
const ensurePythonEnvironment = async () => {
  // 检查虚拟环境是否存在
  if (!checkVenv()) {
    try {
      await createVenv();
      await installDependencies();
    } catch (error) {
      throw new Error(`准备Python环境失败: ${error.message}`);
    }
  }
  
  // 确保转换脚本存在
  const scriptPath = path.join(__dirname, 'convert_tensorboard.py');
  if (!fs.existsSync(scriptPath)) {
    throw new Error('缺少必要的Python脚本: convert_tensorboard.py');
  }
};

// 健康检查路由
router.get('/health', (req, res) => {
  // 检查脚本文件是否存在
  const scriptPath = path.join(__dirname, 'convert_tensorboard.py');
  const scriptExists = fs.existsSync(scriptPath);
  
  // 检查虚拟环境状态
  const venvExists = checkVenv();
  
  res.json({
    status: 'ok',
    scriptExists,
    venvExists,
    pythonCmd: process.platform === 'win32' ? 'python.exe' : 'python3',
    scriptPath
  });
});

// 准备TensorBoard数据并启动服务
router.post('/prepare', async (req, res) => {
  try {
    // 确保Python环境已准备就绪
    await ensurePythonEnvironment();
    
    // 获取模型数据
    const modelData = req.body;
    
    // 将数据写入临时文件供Python脚本读取
    const dataPath = path.join(__dirname, 'temp_model_data.json');
    fs.writeFileSync(dataPath, JSON.stringify(modelData, null, 2));
    
    // 构建Python解释器路径
    const pythonCmd = process.platform === 'win32' 
      ? path.join(venvBin, 'python.exe') 
      : path.join(venvBin, 'python');
    
    // 运行Python脚本处理数据并生成TensorBoard日志
    console.log('启动Python脚本处理模型数据...');
    const scriptPath = path.join(__dirname, 'convert_tensorboard.py');
    const pythonProcess = spawn(pythonCmd, [scriptPath, dataPath]);
    
    // 收集Python输出以便调试
    let pythonOutput = '';
    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      pythonOutput += output;
      console.log(`Python: ${output}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python错误: ${data}`);
    });
    
    // 等待Python脚本完成
    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log('Python脚本执行成功');
          resolve();
        } else {
          reject(new Error(`Python脚本异常退出，代码: ${code}, 输出: ${pythonOutput}`));
        }
      });
    });
    
    // 启动TensorBoard（如果尚未运行）
    if (!tensorboardProcess || tensorboardProcess.killed) {
      console.log('启动TensorBoard服务...');
      
      const tensorboardCmd = process.platform === 'win32' 
        ? path.join(venvBin, 'tensorboard.exe') 
        : path.join(venvBin, 'tensorboard');
      
      const logDir = path.join(__dirname, 'tb_logs');
      
      // 确保日志目录存在
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      tensorboardProcess = spawn(tensorboardCmd, ['--logdir', logDir, '--port', '6006']);
      
      tensorboardProcess.stdout.on('data', (data) => {
        console.log(`TensorBoard: ${data}`);
      });
      
      tensorboardProcess.stderr.on('data', (data) => {
        console.error(`TensorBoard错误: ${data}`);
      });
      
      // 当服务器关闭时清理TensorBoard进程
      process.on('exit', () => {
        if (tensorboardProcess) tensorboardProcess.kill();
      });
      
      // 给TensorBoard一点时间启动
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 返回成功响应
    res.json({ 
      success: true, 
      message: 'TensorBoard已准备就绪', 
      url: 'http://localhost:6006' 
    });
    
  } catch (error) {
    console.error('TensorBoard准备错误:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '未知错误' 
    });
  }
});

// 检查TensorBoard状态
router.get('/status', (req, res) => {
  const isRunning = tensorboardProcess && !tensorboardProcess.killed;
  res.json({ 
    running: isRunning,
    url: isRunning ? 'http://localhost:6006' : null
  });
});

module.exports = router; 