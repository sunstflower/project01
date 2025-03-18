import React, { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '@/store'; 

function MaxPooling2DNode({ data }) {
    const { 
        maxPooling2dConfigs, 
        updateMaxPooling2dConfig 
    } = useStore();

    const index = data.index || 0;
    const currentConfig = maxPooling2dConfigs[index] || {};

    const handlePoolSizeChange = useCallback((e) => {
        const poolSizeValue = parseInt(e.target.value, 10);
        updateMaxPooling2dConfig(index, { poolSize: [poolSizeValue, poolSizeValue] });
    }, [index, updateMaxPooling2dConfig]);

    const handleStridesChange = useCallback((e) => {
        const stridesValue = parseInt(e.target.value, 10);
        updateMaxPooling2dConfig(index, { strides: [stridesValue, stridesValue] });
    }, [index, updateMaxPooling2dConfig]);

    return (
        <div className="bg-white shadow-lg rounded-lg p-6 w-80">
            <Handle
                type="target"
                position={Position.Top}
                className="w-4 h-4 bg-gray-300 rounded-full absolute -top-2 left-1/2 transform -translate-x-1/2"
            />
            <div className="space-y-4">
                <div>
                    <label htmlFor={`PoolSizeInput-${index}`} className="block text-sm font-medium text-gray-700">Pool Size:</label>
                    <input 
                        id={`PoolSizeInput-${index}`} 
                        name="PoolSize" 
                        type="number" 
                        value={currentConfig.poolSize?.[0] || 2} 
                        onChange={handlePoolSizeChange} 
                        className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 nodrag"
                    />
                </div>

                <div>
                    <label htmlFor={`stridesInput-${index}`} className="block text-sm font-medium text-gray-700">Strides:</label>
                    <input 
                        id={`stridesInput-${index}`} 
                        name="strides" 
                        type="number" 
                        value={currentConfig.strides?.[0] || 2} 
                        onChange={handleStridesChange} 
                        className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 nodrag"
                    />
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                id="a"
                className="w-4 h-4 bg-gray-300 rounded-full absolute -bottom-2 left-1/2 transform -translate-x-1/2"
            />
        </div>
    );
}

export default MaxPooling2DNode;



