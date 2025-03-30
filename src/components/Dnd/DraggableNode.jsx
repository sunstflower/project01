import React from 'react';

const DraggableNode = ({ type, label }) => {
  // 根据节点类型显示不同的图标
  const getNodeIcon = () => {
    switch (type) {
      case 'conv2d':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="3" y1="15" x2="21" y2="15"></line>
            <line x1="9" y1="3" x2="9" y2="21"></line>
            <line x1="15" y1="3" x2="15" y2="21"></line>
          </svg>
        );
      case 'maxPooling2d':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 14 10 14 10 20"></polyline>
            <polyline points="20 10 14 10 14 4"></polyline>
            <line x1="14" y1="10" x2="21" y2="3"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        );
      case 'dense':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <line x1="12" y1="2" x2="12" y2="22"></line>
          </svg>
        );
      case 'trainButton':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        );
      default:
        return null;
    }
  };

  // 根据节点类型确定背景颜色
  const getNodeColor = () => {
    switch (type) {
      case 'conv2d':
        return 'bg-blue-500';
      case 'maxPooling2d':
        return 'bg-green-500';
      case 'dense':
        return 'bg-purple-500';
      case 'trainButton':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`${getNodeColor()} text-white p-3 rounded-lg mb-3 cursor-move flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200`}>
      <div className="mr-3">
        {getNodeIcon()}
      </div>
      <div>
        <span className="font-medium">{label}</span>
      </div>
    </div>
  );
};

export default DraggableNode;



