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
          <div className="app-container h-screen w-full flex flex-col overflow-hidden">
            <Routes>
              <Route path="/" element={<Look />} />
              <Route path="/flow" element={
                <div className="flex h-full w-full overflow-hidden">
                  <div className="w-64 h-full overflow-y-auto border-r border-gray-200">
                    <GeneratorBar />
                  </div>
                  <div className="flex-1 h-full">
                    <Flow />
                  </div>
                </div>
              } />
            </Routes>
          </div>
        </Router>
      </ReactFlowProvider>
    </DndProvider>
  );
}

export default App;

// <Navigate to="/flow" replace />



