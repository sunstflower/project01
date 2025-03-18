import React, { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import useDataStore from '@/store'; 

function maxPooling2d() {
    const { 
        maxPooling2dConfig,
        setPoolSize,
        setstridesSize,
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
                    <label htmlFor="PoolSizeInput" className="block text-sm font-medium text-gray-700">PoolSize:</label>
                    <input 
                        id="PoolSizeInput" 
                        name="PoolSize" 
                        type="number" 
                        value={maxPooling2dConfig.poolSize[0]} 
                        onChange={(e) => setPoolSize(parseInt(e.target.value, 10))} 
                        className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="stridesInput" className="block text-sm font-medium text-gray-700">PoolSize:</label>
                    <input 
                        id="stridesInput" 
                        name="strides" 
                        type="number" 
                        value={maxPooling2dConfig.strides[0]} 
                        onChange={(e) => setstridesSize(parseInt(e.target.value, 10))} 
                        className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
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

export default maxPooling2d;



