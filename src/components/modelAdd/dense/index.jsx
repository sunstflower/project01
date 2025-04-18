import React, { useEffect, useRef } from 'react';
import NodeContainer from '../NodeContainer';
import useStore from '@/store'; 

function DenseNode({ data }) {
    const { 
        denseConfigs, 
        updateDenseConfig 
    } = useStore();
    
    // 使用传入的index获取对应的配置
    const configIndex = data.index || 0;
    
    // 添加一个ref来跟踪是否已经初始化配置
    const isInitialized = useRef(false);
    
    // 确保配置存在
    useEffect(() => {
        // 如果已经初始化过，或者配置已存在且设置了units，则跳过
        if (isInitialized.current || (denseConfigs[configIndex] && denseConfigs[configIndex].units)) {
            isInitialized.current = true;
            return;
        }
        
        // 标记为已初始化
        isInitialized.current = true;
        
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
    }, [configIndex, denseConfigs, updateDenseConfig, data.isOutput]);
    
    // 现在安全地获取配置
    const config = denseConfigs[configIndex] || { units: 128, activation: 'relu', kernelInitializer: 'varianceScaling' };

    return (
        <NodeContainer title="Dense" backgroundColor="white">
            <div>
                <label htmlFor="unitsInput" className="block text-sm font-medium text-gray-700">神经元数量 (Units):</label>
                <input 
                    id="unitsInput" 
                    name="units" 
                    type="number" 
                    value={config.units || 128} 
                    onChange={(e) => updateDenseConfig(configIndex, { units: parseInt(e.target.value, 10) })} 
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        </NodeContainer>
    );
}

export default DenseNode;



