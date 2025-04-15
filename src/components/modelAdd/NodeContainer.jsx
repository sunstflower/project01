import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';

/**
 * 公共节点容器组件，为所有模型构建组件提供统一的样式和折叠功能
 * @param {object} props 
 * @param {React.ReactNode} props.children - 子组件内容
 * @param {string} props.title - 节点标题
 * @param {boolean} props.hasInputHandle - 是否显示输入连接点
 * @param {boolean} props.hasOutputHandle - 是否显示输出连接点
 * @param {string} props.inputHandleId - 输入连接点ID
 * @param {string} props.outputHandleId - 输出连接点ID
 * @param {string} props.backgroundColor - 背景颜色
 */
function NodeContainer({ 
  children, 
  title,
  hasInputHandle = true,
  hasOutputHandle = true,
  inputHandleId = null,
  outputHandleId = "a",
  backgroundColor = "white"
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`node-container bg-${backgroundColor} shadow-lg rounded-lg p-3 w-64 transition-all duration-200 border border-gray-200`}
         style={{maxHeight: isCollapsed ? '70px' : '400px', overflow: 'hidden'}}>
      {hasInputHandle && (
        <Handle
          type="target"
          position={Position.Top}
          id={inputHandleId}
          className='w-4 h-4 bg-gray-300 rounded-full'
        />
      )}
      
      <div className="flex justify-between items-center mb-2 cursor-pointer"
           onClick={() => setIsCollapsed(!isCollapsed)}>
        <h3 className="font-semibold text-gray-700">{title}</h3>
        <button 
          className="p-1 rounded-full hover:bg-gray-100"
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
        >
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
      
      <div className={`content-container transition-all duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}
           style={{display: isCollapsed ? 'none' : 'block', maxHeight: '330px', overflowY: 'auto'}}>
        {children}
      </div>
      
      {hasOutputHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          id={outputHandleId}
          className='w-4 h-4 bg-gray-300 rounded-full'
        />
      )}
    </div>
  );
}

export default NodeContainer; 