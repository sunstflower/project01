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

    return (
        <div className="text-updater-node bg-white shadow-lg rounded-lg p-6 w-80">
            <Handle
                type="target"
                position={Position.Top}
                className='w-4 h-4 bg-gray-300 rounded-full'
            />
            <div>
                <label htmlFor={`poolSizeInput-${index}`} className="block text-sm font-medium text-gray-700">Pool Size:</label>
                <input 
                    id={`poolSizeInput-${index}`} 
                    name="poolSize" 
                    type="text" 
                    value={currentConfig.poolSize.join(',')} 
                    onChange={(e) => updateMaxPooling2dConfig(index, { poolSize: e.target.value.split(',').map(Number) })} 
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;"
                />
                
                <label htmlFor={`stridesInput-${index}`} className="block text-sm font-medium text-gray-700">Strides:</label>
                <input 
                    id={`stridesInput-${index}`} 
                    name="strides" 
                    type="text" 
                    value={currentConfig.strides.join(',')} 
                    onChange={(e) => updateMaxPooling2dConfig(index, { strides: e.target.value.split(',').map(Number) })} 
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;"
                />
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

export default MaxPooling2DNode;



