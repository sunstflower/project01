import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

/**
 * 保护路由，确保只有登录用户才能访问
 * @param {Object} props 组件属性
 * @param {React.ReactNode} props.children 子组件
 * @returns {React.ReactNode} 子组件或重定向到登录页面
 */
function ProtectedRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    // 如果用户未登录，重定向到登录页面
    return <Navigate to="/" replace />;
  }
  
  // 用户已登录，渲染子组件
  return children;
}

export default ProtectedRoute; 