import React, { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import useDataStore from '@/store'; 

function Conv2DNode() {
    const { 
        conv2dConfig, 
        setKernelSize, 
        setFilters, 
        setStrides, 
        setActivation, 
        setKernelInitializer 
    } = useDataStore();

    return (
        <div className="text-updater-node bg-white shadow-lg rounded-lg p-6 w-80">
            <Handle
                type="target"
                position={Position.Top}
                className="w-4 h-4 bg-gray-300 rounded-full"
            />
            <div className="space-y-4">
                <div>
                    <label htmlFor="kernelSizeInput" className="block text-sm font-medium text-gray-700">Kernel Size:</label>
                    <input 
                        id="kernelSizeInput" 
                        name="kernelSize" 
                        type="number" 
                        value={conv2dConfig.kernelSize} 
                        onChange={(e) => setKernelSize(parseInt(e.target.value, 10))} 
                        className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="filtersInput" className="block text-sm font-medium text-gray-700">Filters:</label>
                    <input 
                        id="filtersInput" 
                        name="filters" 
                        type="number" 
                        value={conv2dConfig.filters} 
                        onChange={(e) => setFilters(parseInt(e.target.value, 10))} 
                        className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="stridesInput" className="block text-sm font-medium text-gray-700">Strides:</label>
                    <input 
                        id="stridesInput" 
                        name="strides" 
                        type="number" 
                        value={conv2dConfig.strides} 
                        onChange={(e) => setStrides(parseInt(e.target.value, 10))} 
                        className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="activationSelect" className="block text-sm font-medium text-gray-700">Activation:</label>
                    <select 
                        id="activationSelect" 
                        name="activation" 
                        value={conv2dConfig.activation} 
                        onChange={(e) => setActivation(e.target.value)} 
                        className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="relu">ReLU</option>
                        <option value="sigmoid">Sigmoid</option>
                        <option value="softmax">Softmax</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="kernelInitializerSelect" className="block text-sm font-medium text-gray-700">Kernel Initializer:</label>
                    <select 
                        id="kernelInitializerSelect" 
                        name="kernelInitializer" 
                        value={conv2dConfig.kernelInitializer} 
                        onChange={(e) => setKernelInitializer(e.target.value)} 
                        className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="varianceScaling">Variance Scaling</option>
                    </select>
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                id="a"
                className="w-4 h-4 bg-gray-300 rounded-full"
            />
        </div>
    );
}

export default Conv2DNode;



