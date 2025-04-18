import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 检查是否已登录，如果是则重定向到流程编辑器
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/flow');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 表单验证
      if (isLogin) {
        if (!formData.email || !formData.password) {
          throw new Error('请填写所有必填字段');
        }
      } else {
        if (!formData.username || !formData.email || !formData.password) {
          throw new Error('请填写所有必填字段');
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error('两次输入的密码不一致');
        }
        if (formData.password.length < 6) {
          throw new Error('密码长度至少为6个字符');
        }
      }

      // 登录或注册
      if (isLogin) {
        await authService.login(formData.email, formData.password);
      } else {
        await authService.register(formData.username, formData.email, formData.password);
      }

      // 成功后重定向
      navigate('/flow');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl w-full flex flex-col md:flex-row shadow-xl rounded-xl overflow-hidden">
        {/* 左侧：产品介绍 */}
        <div className="w-full md:w-1/2 bg-indigo-600 text-white p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">TensorFlow.js可视化建模平台</h1>
          <p className="text-lg md:text-xl mb-8">直观设计、构建和训练深度学习模型，无需编写代码</p>
          
          <div className="mt-8 md:mt-12">
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-lg">拖放式模型构建</span>
              </div>
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-lg">实时模型验证</span>
              </div>
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-lg">浏览器内训练和评估</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 右侧：登录表单 */}
        <div className="w-full md:w-1/2 bg-white p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold mb-2 text-gray-800">
              {isLogin ? '欢迎回来' : '创建账户'}
            </h2>
            <p className="text-gray-600">
              {isLogin ? '登录您的账户以继续' : '注册一个新账户开始使用'}
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">用户名</label>
                <input 
                  type="text" 
                  name="username" 
                  value={formData.username} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="输入您的用户名"
                />
              </div>
            )}
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">电子邮箱</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="example@email.com"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">密码</label>
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={isLogin ? "输入您的密码" : "创建密码 (至少6个字符)"}
              />
            </div>
            
            {!isLogin && (
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">确认密码</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="再次输入密码"
                />
              </div>
            )}
            
            <button 
              type="submit" 
              className={`w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium ${loading ? 'opacity-70 cursor-wait' : ''}`}
              disabled={loading}
            >
              {loading ? (isLogin ? '登录中...' : '注册中...') : (isLogin ? '登录' : '注册')}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-indigo-600 hover:underline text-sm"
            >
              {isLogin ? '没有账户？创建一个' : '已有账户？登录'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage; 