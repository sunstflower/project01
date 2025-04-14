import React, { useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '@/store'; 

function DenseNode({ data }) {
    const { 
        denseConfigs, 
        updateDenseConfig 
    } = useStore();
    
    // 使用传入的index获取对应的配置
    const configIndex = data.index || 0;
    
    // 确保配置存在
    useEffect(() => {
        // 检查当前配置是否存在且units已设置
        if (!denseConfigs[configIndex] || !denseConfigs[configIndex].units) {
            // 根据是否为最后一个Dense层设置不同的默认值
            const isOutputLayer = data.isOutput || false;
            const defaultUnits = isOutputLayer ? 10 : 128;
            const defaultActivation = isOutputLayer ? 'softmax' : 'relu';
            
            updateDenseConfig(configIndex, { 
                units: defaultUnits,
                activation: defaultActivation,
                kernelInitializer: 'varianceScaling'
            });
            
            console.log(`Dense层 ${configIndex} 设置默认值:`, { 
                units: defaultUnits, 
                activation: defaultActivation 
            });
        }
    }, [configIndex, denseConfigs, updateDenseConfig, data.isOutput]);
    
    // 现在安全地获取配置
    const config = denseConfigs[configIndex] || { units: 128, activation: 'relu', kernelInitializer: 'varianceScaling' };

    return (
        <div className="text-updater-node bg-white shadow-lg rounded-lg p-6 w-80">
            <Handle
                type="target"
                position={Position.Top}
                className='w-4 h-4 bg-gray-300 rounded-full'
            />
            <div>
                <label htmlFor="unitsInput" className="block text-sm font-medium text-gray-700">神经元数量 (Units):</label>
                <input 
                    id="unitsInput" 
                    name="units" 
                    type="number" 
                    value={config.units || 128} 
                    onChange={(e) => updateDenseConfig(configIndex, { units: parseInt(e.target.value, 10) })} 
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;"
                />
                
                <label htmlFor="activationSelect" className="block text-sm font-medium text-gray-700 mt-4">激活函数 (Activation):</label>
                <select 
                    id="activationSelect" 
                    name="activation" 
                    value={config.activation || 'relu'} 
                    onChange={(e) => updateDenseConfig(configIndex, { activation: e.target.value })} 
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="relu">ReLU</option>
                    <option value="sigmoid">Sigmoid</option>
                    <option value="softmax">Softmax</option>
                    <option value="tanh">Tanh</option>
                    <option value="linear">Linear</option>
                </select>
                
                <label htmlFor="kernelInitializerSelect" className="block text-sm font-medium text-gray-700 mt-4">内核初始化 (Kernel Initializer):</label>
                <select 
                    id="kernelInitializerSelect" 
                    name="kernelInitializer" 
                    value={config.kernelInitializer || 'varianceScaling'} 
                    onChange={(e) => updateDenseConfig(configIndex, { kernelInitializer: e.target.value })} 
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="varianceScaling">Variance Scaling</option>
                    <option value="glorotUniform">Glorot Uniform</option>
                    <option value="glorotNormal">Glorot Normal</option>
                    <option value="heUniform">He Uniform</option>
                    <option value="heNormal">He Normal</option>
                    <option value="zeros">Zeros</option>
                    <option value="ones">Ones</option>
                </select>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                id="a"
                className='w-4 h-4 bg-gray-300 rounded-full'
            />
        </div>
    );
}

export default DenseNode;



