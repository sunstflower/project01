import React from 'react';
import { useDrag } from 'react-dnd';
import DraggableNode from './DraggableNode';

// 模型组件配置列表
const MODEL_COMPONENTS = [
  { type: 'useData', label: 'CSV Data Import' },
  { type: 'mnist', label: 'MNIST Dataset' },
  { type: 'conv2d', label: 'Conv2D Layer' },
  { type: 'maxPooling2d', label: 'MaxPooling2D Layer' },
  { type: 'avgPooling2d', label: 'AvgPooling2D Layer' },
  { type: 'dense', label: 'Dense Layer' },
  { type: 'dropout', label: 'Dropout Layer' },
  { type: 'batchNorm', label: 'Batch Normalization' },
  { type: 'flatten', label: 'Flatten Layer' },
  { type: 'lstm', label: 'LSTM Layer' },
  { type: 'gru', label: 'GRU Layer' },
  { type: 'activation', label: 'Activation Layer' },
  { type: 'reshape', label: 'Reshape Layer' },
  { type: 'trainButton', label: 'Train Model' },
];

function GeneratorBar() {
  return (
    <div className="p-4 bg-gray-50 h-full">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 sticky top-0 bg-gray-50 py-2 z-10">Model Components</h2>
      <p className="text-sm text-gray-600 mb-4">Drag and drop components to the canvas</p>
      
      <div className="space-y-4 pb-20">
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold sticky top-16 bg-gray-50 py-1">Data Sources</h3>
        {MODEL_COMPONENTS.slice(0, 2).map((component) => (
          <DraggableComponentWrapper 
            key={component.type} 
            type={component.type} 
            label={component.label} 
          />
        ))}
        
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mt-6 sticky top-16 bg-gray-50 py-1">Convolutional Layers</h3>
        {MODEL_COMPONENTS.slice(2, 5).map((component) => (
          <DraggableComponentWrapper 
            key={component.type} 
            type={component.type} 
            label={component.label} 
          />
        ))}
        
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mt-6 sticky top-16 bg-gray-50 py-1">Dense & Regularization</h3>
        {MODEL_COMPONENTS.slice(5, 8).map((component) => (
          <DraggableComponentWrapper 
            key={component.type} 
            type={component.type} 
            label={component.label} 
          />
        ))}
        
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mt-6 sticky top-16 bg-gray-50 py-1">Recurrent Layers</h3>
        {MODEL_COMPONENTS.slice(8, 10).map((component) => (
          <DraggableComponentWrapper 
            key={component.type} 
            type={component.type} 
            label={component.label} 
          />
        ))}
        
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mt-6 sticky top-16 bg-gray-50 py-1">Utility Layers</h3>
        {MODEL_COMPONENTS.slice(10, 13).map((component) => (
          <DraggableComponentWrapper 
            key={component.type} 
            type={component.type} 
            label={component.label} 
          />
        ))}
        
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mt-6 sticky top-16 bg-gray-50 py-1">Training</h3>
        {MODEL_COMPONENTS.slice(13).map((component) => (
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



