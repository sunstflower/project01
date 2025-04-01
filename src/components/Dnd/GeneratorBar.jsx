import React from 'react';
import { useDrag } from 'react-dnd';
import DraggableNode from './DraggableNode';

// 模型组件配置列表
const MODEL_COMPONENTS = [
  { type: 'useData', label: 'CSV Data Import' },
  { type: 'mnist', label: 'MNIST Dataset' },
  { type: 'conv2d', label: 'Conv2D Layer' },
  { type: 'maxPooling2d', label: 'MaxPooling2D Layer' },
  { type: 'dense', label: 'Dense Layer' },
  { type: 'trainButton', label: 'Train Model' },
];

function GeneratorBar() {
  return (
    <div className="p-4 bg-gray-50 h-full border-r">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">Model Components</h2>
      <p className="text-sm text-gray-600 mb-4">Drag and drop components to the canvas</p>
      
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Data Sources</h3>
        {MODEL_COMPONENTS.slice(0, 2).map((component) => (
          <DraggableComponentWrapper 
            key={component.type} 
            type={component.type} 
            label={component.label} 
          />
        ))}
        
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mt-6">Neural Network Layers</h3>
        {MODEL_COMPONENTS.slice(2, 5).map((component) => (
          <DraggableComponentWrapper 
            key={component.type} 
            type={component.type} 
            label={component.label} 
          />
        ))}
        
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mt-6">Training</h3>
        {MODEL_COMPONENTS.slice(5).map((component) => (
          <DraggableComponentWrapper 
            key={component.type} 
            type={component.type} 
            label={component.label} 
          />
        ))}
      </div>
      
      <div className="mt-8 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-700 mb-2">Tips</h3>
        <ul className="text-xs text-blue-600 list-disc pl-4 space-y-1">
          <li>Drag components to the canvas</li>
          <li>Connect nodes with handles</li>
          <li>Click on nodes to edit parameters</li>
          <li>Press Delete to remove components</li>
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



