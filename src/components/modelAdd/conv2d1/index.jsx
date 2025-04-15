import React, { useCallback } from 'react';
import NodeContainer from '../NodeContainer';
import useStore from '@/store'; 

function Conv2DNode({ data }) {
    const { 
        conv2dConfigs, 
        updateConv2dConfig 
    } = useStore();

    const index = data.index || 0;
    const currentConfig = conv2dConfigs[index] || {};

    return (
        <NodeContainer title="Conv2D" backgroundColor="white">
            <div>
                <label htmlFor={`kernelSizeInput-${index}`} className="block text-sm font-medium text-gray-700">Kernel Size:</label>
                <input 
                    id={`kernelSizeInput-${index}`} 
                    name="kernelSize" 
                    type="number" 
                    value={currentConfig.kernelSize || 5} 
                    onChange={(e) => updateConv2dConfig(index, { kernelSize: parseInt(e.target.value, 10) })} 
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                <label htmlFor={`filtersInput-${index}`} className="block text-sm font-medium text-gray-700 mt-2">Filters:</label>
                <input 
                    id={`filtersInput-${index}`} 
                    name="filters" 
                    type="number" 
                    value={currentConfig.filters || 8} 
                    onChange={(e) => updateConv2dConfig(index, { filters: parseInt(e.target.value, 10) })} 
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                <label htmlFor={`stridesInput-${index}`} className="block text-sm font-medium text-gray-700 mt-2">Strides:</label>
                <input 
                    id={`stridesInput-${index}`} 
                    name="strides" 
                    type="number" 
                    value={currentConfig.strides || 1} 
                    onChange={(e) => updateConv2dConfig(index, { strides: parseInt(e.target.value, 10) })} 
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                <label htmlFor={`activationSelect-${index}`} className="block text-sm font-medium text-gray-700 mt-2">Activation:</label>
                <select 
                    id={`activationSelect-${index}`} 
                    name="activation" 
                    value={currentConfig.activation || 'relu'} 
                    onChange={(e) => updateConv2dConfig(index, { activation: e.target.value })} 
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="relu">ReLU</option>
                    <option value="sigmoid">Sigmoid</option>
                    <option value="softmax">Softmax</option>
                </select>

                <label htmlFor={`kernelInitializerSelect-${index}`} className="block text-sm font-medium text-gray-700 mt-2">Kernel Initializer:</label>
                <select 
                    id={`kernelInitializerSelect-${index}`} 
                    name="kernelInitializer" 
                    value={currentConfig.kernelInitializer || 'varianceScaling'} 
                    onChange={(e) => updateConv2dConfig(index, { kernelInitializer: e.target.value })} 
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="varianceScaling">Variance Scaling</option>
                </select>
            </div>
        </NodeContainer>
    );
}

export default Conv2DNode;





