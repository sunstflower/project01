const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();

// 会话管理器 - 将用户请求与资源关联
const SessionManager = {
  sessions: {},
  
  // 创建新会话
  createSession() {
    const sessionId = crypto.randomBytes(16).toString('hex');
    const sessionDir = path.join(__dirname, 'tb_logs', sessionId);
    
    // 确保会话目录存在
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    
    // 确保临时文件目录存在
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    this.sessions[sessionId] = {
      id: sessionId,
      created: Date.now(),
      logDir: sessionDir,
      dataFile: path.join(__dirname, 'temp', `model_${sessionId}.json`),
      tensorboardProcess: null,
      port: 6006, // 默认端口，后续可动态分配
      lastAccessed: Date.now()
    };
    
    console.log(`创建新会话: ${sessionId}`);
    return this.sessions[sessionId];
  },
  
  // 获取会话，如果不存在则创建
  getOrCreateSession(sessionId) {
    if (sessionId && this.sessions[sessionId]) {
      // 更新最后访问时间
      this.sessions[sessionId].lastAccessed = Date.now();
      return this.sessions[sessionId];
    }
    return this.createSession();
  },
  
  // 清理过期会话
  cleanupSessions(maxAgeMs = 3600000) { // 默认1小时过期
    const now = Date.now();
    Object.keys(this.sessions).forEach(sessionId => {
      const session = this.sessions[sessionId];
      if (now - session.lastAccessed > maxAgeMs) {
        console.log(`清理过期会话: ${sessionId}`);
        this.destroySession(sessionId);
      }
    });
  },
  
  // 销毁会话及其资源
  destroySession(sessionId) {
    const session = this.sessions[sessionId];
    if (!session) return;
    
    // 停止TensorBoard进程
    if (session.tensorboardProcess && !session.tensorboardProcess.killed) {
      try {
        session.tensorboardProcess.kill();
        console.log(`已终止会话 ${sessionId} 的TensorBoard进程`);
      } catch (err) {
        console.error(`终止TensorBoard进程失败: ${err.message}`);
      }
    }
    
    // 清理临时文件
    try {
      if (fs.existsSync(session.dataFile)) {
        fs.unlinkSync(session.dataFile);
        console.log(`已删除会话 ${sessionId} 的数据文件`);
      }
      
      // 递归删除日志目录（可选，取决于是否需要保留历史记录）
      // 如果希望保留历史记录，可以注释掉这段代码
      /*
      if (fs.existsSync(session.logDir)) {
        fs.rmdirSync(session.logDir, { recursive: true });
        console.log(`已删除会话 ${sessionId} 的日志目录`);
      }
      */
    } catch (err) {
      console.error(`清理会话文件失败: ${err.message}`);
    }
    
    // 从会话列表中移除
    delete this.sessions[sessionId];
    console.log(`会话 ${sessionId} 已销毁`);
  }
};

// 进程管理器 - 处理Python和TensorBoard进程
const ProcessManager = {
  // 运行Python转换脚本
  async runPythonScript(session, modelData) {
    // 准备虚拟环境
    await ensurePythonEnvironment();
    
    // 将数据写入会话特定的临时文件
    fs.writeFileSync(session.dataFile, JSON.stringify(modelData, null, 2), 'utf8');
    
    // 构建Python解释器路径
    const pythonCmd = process.platform === 'win32' 
      ? path.join(venvBin, 'python.exe') 
      : path.join(venvBin, 'python');
    
    // 确保标准的logs目录存在
    const standardLogsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(standardLogsDir)) {
      fs.mkdirSync(standardLogsDir, { recursive: true });
    }
    
    // 确保会话日志目录存在并具有正确的权限
    fs.chmodSync(session.logDir, 0o755);
    
    // 运行Python脚本
    const scriptPath = path.join(__dirname, 'convert_tensorboard.py');
    
    console.log(`为会话 ${session.id} 运行Python脚本...`);
    console.log(`命令: ${pythonCmd} ${scriptPath} ${session.dataFile} --output-dir ${session.logDir}`);
    
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(pythonCmd, [
        scriptPath, 
        session.dataFile,
        '--output-dir', session.logDir
      ], {
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1' // 确保Python输出不被缓冲
        }
      });
      
      let pythonOutput = '';
      let pythonError = '';
      
      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        pythonOutput += output;
        console.log(`[${session.id}] Python输出: ${output}`);
      });
      
      pythonProcess.stderr.on('data', (data) => {
        const errorOutput = data.toString();
        pythonError += errorOutput;
        console.error(`[${session.id}] Python错误: ${errorOutput}`);
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`[${session.id}] Python脚本执行成功`);
          
          // 验证日志目录中是否有文件
          try {
            const files = fs.readdirSync(session.logDir);
            console.log(`[${session.id}] 日志目录文件数量: ${files.length}`);
            
            if (files.length === 0) {
              console.warn(`[${session.id}] 警告: 日志目录为空`);
            } else {
              console.log(`[${session.id}] 日志目录文件: ${files.join(', ')}`);
            }
            
            // 检查ready标记文件
            const tbReadyPath = path.join(path.dirname(session.logDir), 'tb_ready.txt');
            if (fs.existsSync(tbReadyPath)) {
              const readyContent = fs.readFileSync(tbReadyPath, 'utf8');
              console.log(`[${session.id}] TensorBoard就绪标记内容: ${readyContent}`);
            } else {
              console.warn(`[${session.id}] 警告: 未找到TensorBoard就绪标记文件`);
            }
            
          } catch (err) {
            console.error(`[${session.id}] 验证日志目录失败: ${err.message}`);
          }
          
          resolve({ success: true, output: pythonOutput });
        } else {
          reject(new Error(`Python脚本异常退出，代码: ${code}, 输出: ${pythonOutput || '无'}, 错误: ${pythonError || '无'}`));
        }
      });
    });
  },
  
  // 启动TensorBoard
  startTensorBoard(session) {
    // 如果已有运行中的TensorBoard进程，先停止它
    if (session.tensorboardProcess && !session.tensorboardProcess.killed) {
      session.tensorboardProcess.kill();
    }
    
    const tensorboardCmd = process.platform === 'win32' 
      ? path.join(venvBin, 'tensorboard.exe') 
      : path.join(venvBin, 'tensorboard');
    
    // 确保日志目录存在且不为空
    const logDirExists = fs.existsSync(session.logDir);
    let logDirFiles = [];
    if (logDirExists) {
      logDirFiles = fs.readdirSync(session.logDir);
    }
    
    // 检查标准日志目录
    const standardLogsDir = path.join(__dirname, 'logs');
    const standardLogsExist = fs.existsSync(standardLogsDir);
    let standardLogsFiles = [];
    if (standardLogsExist) {
      standardLogsFiles = fs.readdirSync(standardLogsDir);
    }
    
    console.log(`为会话 ${session.id} 启动TensorBoard...`);
    console.log(`会话日志目录: ${session.logDir}`);
    console.log(`会话日志目录存在: ${logDirExists}`);
    console.log(`会话日志目录文件: ${logDirFiles.join(', ')}`);
    console.log(`标准日志目录: ${standardLogsDir}`);
    console.log(`标准日志目录存在: ${standardLogsExist}`);
    console.log(`标准日志目录文件: ${standardLogsFiles.join(', ')}`);
    
    // 获取日志目录的绝对路径
    const absoluteLogDir = path.resolve(session.logDir);
    console.log(`日志目录绝对路径: ${absoluteLogDir}`);
    
    // 构建TensorBoard命令行参数
    const tensorboardArgs = [
      '--logdir', absoluteLogDir,
      '--port', session.port,
      '--bind_all'  // 允许外部访问
    ];
    
    // 准备标准的TensorBoard日志目录结构
    if (!fs.existsSync(path.join(absoluteLogDir, 'train'))) {
      fs.mkdirSync(path.join(absoluteLogDir, 'train'), { recursive: true });
    }
    
    // 确保在logs目录中创建一个符号链接或复制文件
    try {
      const logsDirLink = path.join(__dirname, 'logs', session.id);
      if (!fs.existsSync(logsDirLink)) {
        if (process.platform === 'win32') {
          // Windows上创建目录连接
          const mkdirpSync = (p) => {
            if (!fs.existsSync(p)) {
              mkdirpSync(path.dirname(p));
              fs.mkdirSync(p);
            }
          };
          
          mkdirpSync(path.dirname(logsDirLink));
          // 在Windows上复制目录内容
          fs.symlinkSync(absoluteLogDir, logsDirLink, 'junction');
        } else {
          // Unix/Linux/Mac上创建符号链接
          fs.symlinkSync(absoluteLogDir, logsDirLink);
        }
        console.log(`为会话 ${session.id} 创建日志目录链接: ${logsDirLink}`);
      }
    } catch (linkErr) {
      console.error(`创建日志目录链接失败: ${linkErr.message}`);
    }
    
    // 打印完整的TensorBoard命令
    console.log(`启动TensorBoard命令: ${tensorboardCmd} ${tensorboardArgs.join(' ')}`);
    
    return new Promise((resolve, reject) => {
      try {
        // 启动新的TensorBoard进程
        session.tensorboardProcess = spawn(tensorboardCmd, tensorboardArgs, {
          env: {
            ...process.env,
            PYTHONUNBUFFERED: '1'  // 确保Python输出不被缓冲
          }
        });
        
        let output = '';
        
        session.tensorboardProcess.stdout.on('data', (data) => {
          const text = data.toString();
          output += text;
          console.log(`[${session.id}] TensorBoard: ${text}`);
          
          // 检测TensorBoard是否成功启动
          if (text.includes('TensorBoard') && text.includes('http://')) {
            resolve(true);
          }
        });
        
        session.tensorboardProcess.stderr.on('data', (data) => {
          const errorText = data.toString();
          console.error(`[${session.id}] TensorBoard错误: ${errorText}`);
          
          // 在某些情况下，TensorBoard会通过stderr输出启动信息
          if (errorText.includes('TensorBoard') && errorText.includes('http://')) {
            resolve(true);
          }
        });
        
        // 如果4秒内没有检测到成功启动，也当作成功处理
        setTimeout(() => {
          console.log(`[${session.id}] TensorBoard启动超时，假定成功`);
          resolve(true);
        }, 4000);
        
        // 处理进程异常退出
        session.tensorboardProcess.on('exit', (code) => {
          if (code !== 0) {
            console.error(`[${session.id}] TensorBoard异常退出，代码: ${code}`);
            // 如果进程已退出，尝试重新启动
            if (!resolve.called) {
              reject(new Error(`TensorBoard进程异常退出，代码: ${code}`));
            }
          }
        });
        
        // 处理进程错误
        session.tensorboardProcess.on('error', (err) => {
          console.error(`[${session.id}] TensorBoard进程错误: ${err.message}`);
          if (!resolve.called) {
            reject(err);
          }
        });
        
      } catch (err) {
        console.error(`[${session.id}] 启动TensorBoard时出错: ${err.message}`);
        reject(err);
      }
    });
  }
};

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

// 创建Python虚拟环境
const createVenv = () => {
  return new Promise((resolve, reject) => {
    console.log('创建Python虚拟环境...');
    
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const venvProcess = spawn(pythonCmd, ['-m', 'venv', venvPath]);
    
    venvProcess.stdout.on('data', (data) => {
      console.log(`venv创建输出: ${data}`);
    });
    
    venvProcess.stderr.on('data', (data) => {
      console.error(`venv创建错误: ${data}`);
    });
    
    venvProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Python虚拟环境创建成功');
        resolve();
      } else {
        reject(new Error(`虚拟环境创建失败，代码: ${code}`));
      }
    });
  });
};

// 安装必要的Python依赖
const installDependencies = () => {
  return new Promise((resolve, reject) => {
    console.log('安装Python依赖...');
    
    const pipCmd = process.platform === 'win32' 
      ? path.join(venvBin, 'pip.exe') 
      : path.join(venvBin, 'pip');
    
    const requirementsPath = path.join(__dirname, 'requirements.txt');
    const pipProcess = spawn(pipCmd, ['install', '-r', requirementsPath]);
    
    pipProcess.stdout.on('data', (data) => {
      console.log(`pip安装输出: ${data}`);
    });
    
    pipProcess.stderr.on('data', (data) => {
      console.error(`pip安装错误: ${data}`);
    });
    
    pipProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Python依赖安装成功');
        resolve();
      } else {
        reject(new Error(`依赖安装失败，代码: ${code}`));
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

// 启动会话清理定时任务
setInterval(() => {
  SessionManager.cleanupSessions();
}, 15 * 60 * 1000); // 每15分钟清理一次

// 健康检查路由
router.get('/health', (req, res) => {
  const scriptPath = path.join(__dirname, 'convert_tensorboard.py');
  const scriptExists = fs.existsSync(scriptPath);
  
  res.json({ 
    status: 'ok', 
    pythonScript: {
      exists: scriptExists,
      path: scriptPath
    },
    sessions: {
      active: Object.keys(SessionManager.sessions).length
    }
  });
});

// 检查TensorBoard状态
router.get('/status', (req, res) => {
  const { sessionId } = req.query;
  const session = SessionManager.getOrCreateSession(sessionId);
  
  const isRunning = session.tensorboardProcess && !session.tensorboardProcess.killed;
  
  res.json({
    running: isRunning,
    url: isRunning ? `http://localhost:${session.port}` : null,
    sessionId: session.id
  });
});

// 准备TensorBoard数据并启动服务
router.post('/prepare', async (req, res) => {
  try {
    // 获取或创建会话
    const sessionId = req.query.sessionId || req.body.sessionId;
    const session = SessionManager.getOrCreateSession(sessionId);
    
    // 获取模型数据
    const modelData = req.body;
    
    // 验证收到的数据
    console.log(`[${session.id}] 收到的请求数据:`, JSON.stringify({
      hasModelStructure: Array.isArray(modelData.modelStructure),
      modelStructureLength: modelData.modelStructure ? modelData.modelStructure.length : 0,
      hasEdges: Array.isArray(modelData.edges),
      edgesLength: modelData.edges ? modelData.edges.length : 0
    }));
    
    // 验证数据格式
    if (!modelData || !Array.isArray(modelData.modelStructure) || modelData.modelStructure.length === 0) {
      throw new Error('无效的模型结构数据');
    }
    
    // 运行Python脚本生成TensorBoard数据
    await ProcessManager.runPythonScript(session, modelData);
    
    // 启动TensorBoard
    await ProcessManager.startTensorBoard(session);
    
    // 返回成功响应
    res.json({ 
      success: true, 
      message: 'TensorBoard已准备就绪', 
      url: `http://localhost:${session.port}`,
      sessionId: session.id
    });
    
  } catch (error) {
    console.error('TensorBoard准备错误:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '未知错误' 
    });
  }
});

// 关闭会话的TensorBoard
router.post('/stop', (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId || !SessionManager.sessions[sessionId]) {
      return res.status(404).json({
        success: false,
        error: '会话不存在'
      });
    }
    
    SessionManager.destroySession(sessionId);
    
  res.json({ 
      success: true,
      message: '会话已关闭'
    });
  } catch (error) {
    console.error('关闭会话错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '未知错误'
    });
  }
});

module.exports = router; 