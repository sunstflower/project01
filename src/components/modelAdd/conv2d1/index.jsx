import React, { useEffect } from 'react';
import NodeContainer from '../NodeContainer';
import useStore from '@/store'; 

function Conv2DNode({ data, id }) {
    const { 
        conv2dConfigs, 
        updateConv2dConfig 
    } = useStore();

    const nodeId = id;

    // 确保配置存在
    useEffect(() => {
        // 检查该节点ID是否已有配置
        if (!conv2dConfigs[nodeId]) {
            // 创建新配置
            updateConv2dConfig(nodeId, {
                kernelSize: 5,
                filters: 8,
                strides: 1,
                activation: 'relu',
                kernelInitializer: 'varianceScaling',
            });
            
            console.log(`Conv2D层 ${nodeId} 设置默认值`);
        }
    }, [nodeId, conv2dConfigs, updateConv2dConfig]);

    // 获取该节点的配置
    const currentConfig = conv2dConfigs[nodeId] || {
        kernelSize: 5,
        filters: 8,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
    };

    return (
        <NodeContainer title="Conv2D" backgroundColor="white">
            <div>
                <label htmlFor={`kernelSizeInput-${nodeId}`} className="block text-sm font-medium text-gray-700">Kernel Size:</label>
                <input 
                    id={`kernelSizeInput-${nodeId}`} 
                    name="kernelSize" 
                    type="number" 
                    value={currentConfig.kernelSize || 5} 
                    onChange={(e) => updateConv2dConfig(nodeId, { kernelSize: parseInt(e.target.value, 10) })} 
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                <label htmlFor={`filtersInput-${nodeId}`} className="block text-sm font-medium text-gray-700 mt-2">Filters:</label>
                <input 
                    id={`filtersInput-${nodeId}`} 
                    name="filters" 
                    type="number" 
                    value={currentConfig.filters || 8} 
                    onChange={(e) => updateConv2dConfig(nodeId, { filters: parseInt(e.target.value, 10) })} 
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                <label htmlFor={`stridesInput-${nodeId}`} className="block text-sm font-medium text-gray-700 mt-2">Strides:</label>
                <input 
                    id={`stridesInput-${nodeId}`} 
                    name="strides" 
                    type="number" 
                    value={currentConfig.strides || 1} 
                    onChange={(e) => updateConv2dConfig(nodeId, { strides: parseInt(e.target.value, 10) })} 
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                <label htmlFor={`activationSelect-${nodeId}`} className="block text-sm font-medium text-gray-700 mt-2">Activation:</label>
                <select 
                    id={`activationSelect-${nodeId}`} 
                    name="activation" 
                    value={currentConfig.activation || 'relu'} 
                    onChange={(e) => updateConv2dConfig(nodeId, { activation: e.target.value })} 
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="relu">ReLU</option>
                    <option value="sigmoid">Sigmoid</option>
                    <option value="softmax">Softmax</option>
                </select>

                <label htmlFor={`kernelInitializerSelect-${nodeId}`} className="block text-sm font-medium text-gray-700 mt-2">Kernel Initializer:</label>
                <select 
                    id={`kernelInitializerSelect-${nodeId}`} 
                    name="kernelInitializer" 
                    value={currentConfig.kernelInitializer || 'varianceScaling'} 
                    onChange={(e) => updateConv2dConfig(nodeId, { kernelInitializer: e.target.value })} 
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="varianceScaling">Variance Scaling</option>
                </select>
            </div>
        </NodeContainer>
    );
}

export default Conv2DNode;





