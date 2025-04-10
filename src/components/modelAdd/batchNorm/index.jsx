import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '@/store';

function BatchNormNode({ data }) {
  const { batchNormConfigs, updateBatchNormConfig } = useStore();
  const configIndex = data.index || 0;
  const config = batchNormConfigs[configIndex] || {
    axis: -1,
    momentum: 0.99,
    epsilon: 0.001,
    center: true,
    scale: true,
  };

  const [momentum, setMomentum] = useState(config.momentum);
  const [epsilon, setEpsilon] = useState(config.epsilon);
  const [center, setCenter] = useState(config.center);
  const [scale, setScale] = useState(config.scale);

  const handleMomentumChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 1) {
      setMomentum(value);
      updateBatchNormConfig(configIndex, { ...config, momentum: value });
    }
  };

  const handleEpsilonChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0.0001 && value <= 0.1) {
      setEpsilon(value);
      updateBatchNormConfig(configIndex, { ...config, epsilon: value });
    }
  };

  const handleCenterChange = (e) => {
    const checked = e.target.checked;
    setCenter(checked);
    updateBatchNormConfig(configIndex, { ...config, center: checked });
  };

  const handleScaleChange = (e) => {
    const checked = e.target.checked;
    setScale(checked);
    updateBatchNormConfig(configIndex, { ...config, scale: checked });
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 w-80 border border-indigo-100">
      <div className="text-lg font-medium text-gray-800 mb-4 bg-indigo-100 -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
        Batch Normalization 层
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 bg-indigo-400 rounded-full"
      />
      
      <div className="space-y-5">
        <div>
          <label 
            className="block text-sm font-medium text-gray-700 mb-1" 
            title="用于计算指数移动平均值的动量"
          >
            动量:
          </label>
          <input 
            type="number" 
            min="0" 
            max="1" 
            step="0.01"
            value={momentum}
            onChange={handleMomentumChange}
            className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500">范围: 0-1</p>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <label 
            className="block text-sm font-medium text-gray-700 mb-1" 
            title="添加到方差的小常数，避免除零"
          >
            Epsilon:
          </label>
          <input 
            type="number" 
            min="0.0001" 
            max="0.1" 
            step="0.0001"
            value={epsilon}
            onChange={handleEpsilonChange}
            className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500">范围: 0.0001-0.1</p>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center mb-3">
            <label 
              className="text-sm font-medium text-gray-700" 
              title="是否将偏移参数添加到归一化的张量"
            >
              Center:
            </label>
            <div className="relative inline-block w-10 align-middle select-none">
              <input 
                type="checkbox" 
                id="center" 
                checked={center} 
                onChange={handleCenterChange}
                className="sr-only"
              />
              <div className={`block w-10 h-6 rounded-full ${center ? 'bg-indigo-400' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${center ? 'transform translate-x-4' : ''}`}></div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <label 
              className="text-sm font-medium text-gray-700" 
              title="是否将缩放参数应用于归一化的张量"
            >
              Scale:
            </label>
            <div className="relative inline-block w-10 align-middle select-none">
              <input 
                type="checkbox" 
                id="scale" 
                checked={scale} 
                onChange={handleScaleChange}
                className="sr-only"
              />
              <div className={`block w-10 h-6 rounded-full ${scale ? 'bg-indigo-400' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${scale ? 'transform translate-x-4' : ''}`}></div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-3 text-sm text-gray-500">
          标准化每个批次的激活以加速训练并提高模型稳定性
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        className="w-4 h-4 bg-indigo-400 rounded-full"
      />
    </div>
  );
}

export default BatchNormNode; 