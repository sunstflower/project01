// 测试TensorBoard API连接
const http = require('http');
const fs = require('fs');
const path = require('path');

// 测试健康检查
console.log('测试健康检查...');
http.get('http://localhost:5001/api/health', (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('健康检查响应状态码:', res.statusCode);
    console.log('健康检查响应数据:', data);
    
    // 测试TensorBoard状态
    console.log('\n测试TensorBoard状态...');
    http.get('http://localhost:5001/api/tensorboard/health', (res) => {
      let tbData = '';
      
      res.on('data', (chunk) => {
        tbData += chunk;
      });
      
      res.on('end', () => {
        console.log('TensorBoard状态响应状态码:', res.statusCode);
        console.log('TensorBoard状态响应数据:', tbData);
        
        // 测试脚本文件
        const scriptPath = path.join(__dirname, 'convert_tensorboard.py');
        console.log('\n检查Python脚本文件...');
        console.log('脚本路径:', scriptPath);
        console.log('脚本存在:', fs.existsSync(scriptPath));
        
        if (fs.existsSync(scriptPath)) {
          console.log('脚本内容前100个字符:');
          const content = fs.readFileSync(scriptPath, 'utf8').substring(0, 100);
          console.log(content);
        }
      });
    }).on('error', (err) => {
      console.error('TensorBoard状态请求错误:', err.message);
    });
  });
}).on('error', (err) => {
  console.error('健康检查请求错误:', err.message);
}); 