import React from 'react';
import { useDrag } from 'react-dnd';
import DraggableNode from './DraggableNode';

// 模型组件配置列表
const MODEL_COMPONENTS = [
  { type: 'conv2d', label: 'Conv2D 卷积层' },
  { type: 'maxPooling2d', label: 'MaxPooling2D 池化层' },
  { type: 'dense', label: '全连接层' },
  { type: 'trainButton', label: '训练按钮' },
];

function GeneratorBar() {
  return (
    <div className="p-4 bg-gray-50 h-full border-r">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">模型组件库</h2>
      <p className="text-sm text-gray-600 mb-4">拖拽以下组件到右侧画布构建模型</p>
      
      <div className="space-y-4">
        {MODEL_COMPONENTS.map((component) => (
          <DraggableComponentWrapper 
            key={component.type} 
            type={component.type} 
            label={component.label} 
          />
        ))}
      </div>
      
      <div className="mt-8 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-700 mb-2">使用提示</h3>
        <ul className="text-xs text-blue-600 list-disc pl-4 space-y-1">
          <li>拖拽组件到右侧画布</li>
          <li>使用连接点连接各组件</li>
          <li>点击组件可编辑参数</li>
          <li>按Delete键可删除组件</li>
        </ul>
      </div>
    </div>
  );
}

// 拖拽包装组件
const DraggableComponentWrapper = ({ type, label }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: type,
    item: { type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div 
      ref={drag} 
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="transition-opacity duration-200"
    >
      <DraggableNode type={type} label={label} />
    </div>
  );
};

export default GeneratorBar;



