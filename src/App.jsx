import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Flow from '@/components/Flow';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ReactFlowProvider } from '@xyflow/react';
import './index.css';
import LoginPage from './components/LoginPage';
import GeneratorBar from './components/Dnd/GeneratorBar';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <ReactFlowProvider>
        <Router>
          <div className="app-container h-screen w-full flex flex-col overflow-hidden">
            <Routes>
              {/* 登录/注册页面 */}
              <Route path="/" element={<LoginPage />} />
              
              {/* 受保护的流程编辑器页面 */}
              <Route path="/flow" element={
                <ProtectedRoute>
                  <div className="flex flex-col h-full w-full overflow-hidden">
                    <div className="flex flex-1 overflow-hidden">
                      <div className="w-64 h-full overflow-y-auto border-r border-gray-200">
                        <GeneratorBar />
                      </div>
                      <div className="flex-1 h-full">
                        <Flow />
                      </div>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              {/* 添加带有项目ID的路由 */}
              <Route path="/flow/:projectId" element={
                <ProtectedRoute>
                  <div className="flex flex-col h-full w-full overflow-hidden">
                    <div className="flex flex-1 overflow-hidden">
                      <div className="w-64 h-full overflow-y-auto border-r border-gray-200">
                        <GeneratorBar />
                      </div>
                      <div className="flex-1 h-full">
                        <Flow />
                      </div>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              {/* 将来可以添加更多受保护的路由，如项目列表页面 */}
              <Route path="/projects" element={
                <ProtectedRoute>
                  <div className="flex flex-col h-full w-full overflow-hidden">
                    <div className="p-6">
                      <h1 className="text-2xl font-bold mb-6">我的项目</h1>
                      <p className="text-gray-600">项目列表页面（暂未实现）</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              {/* 处理未知路由 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </ReactFlowProvider>
    </DndProvider>
  );
}

export default App;

// <Navigate to="/flow" replace />



