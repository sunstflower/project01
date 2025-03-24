
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Flow from '@/components/canvas'

function App() {
  return (
    <Router>
      <div className="p-8">
        <Navigation />
        <Routes>
          <Route path="/Flow" element={<Flow />} />
        </Routes>
      </div>
    </Router>
  );
}

// 导航组件（使用按钮）
const Navigation = () => {
  const navigate = useNavigate();

  return (
    <div className="flex space-x-4 mb-8">
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => navigate('/Flow')}
      >
        Flow
      </button>
     
    </div>
  );
};

export default App;
