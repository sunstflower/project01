import React, { useEffect } from 'react';
import NodeContainer from '../NodeContainer';
import useStore from '@/store'; 

function DenseNode({ data, id }) {
    const { 
        denseConfigs, 
        updateDenseConfig,
        addDenseConfig
    } = useStore();
    
    // 使用节点ID而非索引
    const nodeId = id;
    
    // 确保配置存在
    useEffect(() => {
        // 检查该节点ID是否已有配置
        if (!denseConfigs[nodeId]) {
            // 根据是否为最后一个Dense层设置不同的默认值
            const isOutputLayer = data.isOutput || false;
            const defaultUnits = isOutputLayer ? 10 : 128;
            const defaultActivation = isOutputLayer ? 'softmax' : 'relu';
            
            // 创建新配置
            updateDenseConfig(nodeId, { 
                units: defaultUnits,
                activation: defaultActivation,
                kernelInitializer: 'varianceScaling'
            });
            
            console.log(`Dense层 ${nodeId} 设置默认值:`, { 
                units: defaultUnits, 
                activation: defaultActivation 
            });
        }
    }, [nodeId, denseConfigs, updateDenseConfig, data.isOutput]);
    
    // 获取该节点的配置
    const config = denseConfigs[nodeId] || { 
        units: 128, 
        activation: 'relu', 
        kernelInitializer: 'varianceScaling' 
    };

    return (
        <NodeContainer title="Dense" backgroundColor="white">
            <div>
                <label htmlFor={`unitsInput-${nodeId}`} className="block text-sm font-medium text-gray-700">神经元数量 (Units):</label>
                <input 
                    id={`unitsInput-${nodeId}`} 
                    name="units" 
                    type="number" 
                    value={config.units || 128} 
                    onChange={(e) => updateDenseConfig(nodeId, { units: parseInt(e.target.value, 10) })} 
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                <label htmlFor={`activationSelect-${nodeId}`} className="block text-sm font-medium text-gray-700 mt-4">激活函数 (Activation):</label>
                <select 
                    id={`activationSelect-${nodeId}`} 
                    name="activation" 
                    value={config.activation || 'relu'} 
                    onChange={(e) => updateDenseConfig(nodeId, { activation: e.target.value })} 
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="relu">ReLU</option>
                    <option value="sigmoid">Sigmoid</option>
                    <option value="softmax">Softmax</option>
                    <option value="tanh">Tanh</option>
                    <option value="linear">Linear</option>
                </select>
                
                <label htmlFor={`kernelInitializerSelect-${nodeId}`} className="block text-sm font-medium text-gray-700 mt-4">内核初始化 (Kernel Initializer):</label>
                <select 
                    id={`kernelInitializerSelect-${nodeId}`} 
                    name="kernelInitializer" 
                    value={config.kernelInitializer || 'varianceScaling'} 
                    onChange={(e) => updateDenseConfig(nodeId, { kernelInitializer: e.target.value })} 
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



