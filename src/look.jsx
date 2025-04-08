import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

function Look() {

    // 导航组件（使用按钮）
const Navigation = () => {
    const navigate = useNavigate();
  
    return (
      <div className="flex space-x-4 mb-8">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => navigate('/flow')}
        >
          开始
        </button>
      </div>
    );
  };


    return(
        <div>
           <Navigation />
        </div>
    )
}

export default Look;