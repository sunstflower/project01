import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Flow from '@/components/Flow'
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend'
import { ReactFlowProvider } from '@xyflow/react';
import './index.css';
import Look from './look';
import GeneratorBar from './components/Dnd/GeneratorBar';

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <ReactFlowProvider>
        <Router>
          <div className="app-container h-full w-full flex flex-col">
            <Navigation />
            <div className="flex-1 flex">
              <div className="w-1/4">
                <GeneratorBar />
              </div>
              <div className="w-3/4">
                <Routes>
                  <Route path="/" element={<Look />} />
                  <Route path="/flow" element={<Flow />} />
                </Routes>
              </div>
            </div>
          </div>
        </Router>
      </ReactFlowProvider>
    </DndProvider>
  );
}

// 导航组件（使用按钮）
const Navigation = () => {
  const navigate = useNavigate();

  return (
    <div className="flex space-x-4 mb-8">
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => navigate('/flow')}
      >
        Flow
      </button>
    </div>
  );
};

export default App;

// <Navigate to="/flow" replace />



