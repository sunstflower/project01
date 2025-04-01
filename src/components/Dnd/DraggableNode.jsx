import React from 'react';

const DraggableNode = ({ type, label }) => {
  // 根据节点类型显示不同的图标
  const getNodeIcon = () => {
    switch (type) {
      case 'useData':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        );
      case 'mnist':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <rect x="7" y="7" width="10" height="10" rx="1" ry="1"></rect>
          </svg>
        );
      case 'conv2d':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="3" y1="15" x2="21" y2="15"></line>
            <line x1="9" y1="3" x2="9" y2="21"></line>
            <line x1="15" y1="3" x2="15" y2="21"></line>
          </svg>
        );
      case 'maxPooling2d':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 14 10 14 10 20"></polyline>
            <polyline points="20 10 14 10 14 4"></polyline>
            <line x1="14" y1="10" x2="21" y2="3"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        );
      case 'dense':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <line x1="12" y1="2" x2="12" y2="22"></line>
          </svg>
        );
      case 'trainButton':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="13 17 18 12 13 7"></polyline>
            <polyline points="6 17 11 12 6 7"></polyline>
          </svg>
        );
      default:
        return null;
    }
  };

  // 根据节点类型确定Apple设计风格的颜色
  const getNodeColor = () => {
    switch (type) {
      case 'useData':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'mnist':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'conv2d':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'maxPooling2d':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'dense':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'trainButton':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div 
      className={`${getNodeColor()} rounded-xl p-3 mb-3 cursor-move flex items-center shadow-sm border 
      hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200`}
    >
      <div className="mr-3 p-2 rounded-lg bg-white bg-opacity-50">
        {getNodeIcon()}
      </div>
      <div>
        <span className="font-medium">{label}</span>
      </div>
    </div>
  );
};

export default DraggableNode;



