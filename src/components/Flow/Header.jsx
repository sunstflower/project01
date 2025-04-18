import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import projectService from '../../services/projectService';

function Header({ currentProject, onSaveProject }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  
  // 加载用户信息
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);
  
  // 处理登出
  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };
  
  // 处理保存项目
  const handleSaveProject = async () => {
    if (!onSaveProject) return;
    
    setIsSaving(true);
    try {
      await onSaveProject();
      alert('项目保存成功！');
    } catch (error) {
      console.error('保存项目失败:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // 处理导出项目
  const handleExportProject = () => {
    if (!currentProject || !currentProject.id) {
      alert('请先保存项目后再导出');
      return;
    }
    
    try {
      projectService.exportProject(currentProject.id);
    } catch (error) {
      console.error('导出项目失败:', error);
      alert(`导出项目失败: ${error.message}`);
    }
  };
  
  // 处理导入项目
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // 处理文件选择
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedProject = projectService.importProject(e.target.result);
        alert(`项目"${importedProject.name}"导入成功！`);
        navigate(`/flow/${importedProject.id}`);
      } catch (error) {
        console.error('导入项目失败:', error);
        alert(`导入项目失败: ${error.message}`);
      }
    };
    reader.readAsText(file);
    
    // 重置文件输入，允许选择同一文件
    event.target.value = '';
  };
  
  return (
    <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center border-b border-gray-200">
      {/* 左侧 Logo 和标题 */}
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="text-xl font-semibold text-gray-800">TensorFlow.js可视化平台</span>
      </div>
      
      {/* 右侧用户信息和操作按钮 */}
      <div className="flex items-center space-x-4">
        {/* 项目名称 */}
        {currentProject && (
          <span className="text-gray-700">
            当前项目: <span className="font-medium">{currentProject.name}</span>
          </span>
        )}
        
        {/* 导入项目按钮 */}
        <button
          onClick={handleImportClick}
          className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          导入项目
        </button>
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".json"
          style={{ display: 'none' }}
        />
        
        {/* 导出项目按钮 */}
        {currentProject && currentProject.id && (
          <button
            onClick={handleExportProject}
            className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            导出项目
          </button>
        )}
        
        {/* 保存按钮 */}
        <button
          onClick={handleSaveProject}
          disabled={isSaving}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            isSaving 
              ? 'bg-gray-300 text-gray-500 cursor-wait' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isSaving ? '保存中...' : '保存项目'}
        </button>
        
        {/* 用户菜单 */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                {user.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium hidden md:block">{user.username || '用户'}</span>
              
              {/* 下拉箭头 */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>
            
            {/* 下拉菜单 */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/projects');
                  }}
                >
                  我的项目
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={(e) => {
                    e.preventDefault();
                    // 暂未实现
                  }}
                >
                  账户设置
                </a>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  退出登录
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header; 