import React, { useCallback, useDebugValue } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '@/store';

function dense() {
    const {
        denseConfig,
        updateDenseConfig
    } = useStore()

    const handleUnitsChange = useCallback((e) => {
        const units = parseInt(e.target.value, 10);
        updateDenseConfig({ units })
    }, [updateDenseConfig])

   
    return (
        <div className="text-updater-node bg-white shadow-lg rounded-lg p-6 w-80">
            <Handle
                type="target"
                position={Position.Top}
                className="w-4 h-4 bg-gray-300 rounded-full"
            />
            <div>
                <label htmlFor="flatten" className="block text-sm font-medium text-gray-700"> flatten </label>
                <div>
                    <label htmlFor={"units"} className="block text-sm font-medium text-gray-700"> units: </label>
                    <input
                        id={"units"}
                        name="unitsSize"
                        type="number"
                        value={denseConfig?.units || 10}
                        onChange={handleUnitsChange}
                        className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 nodrag"
                    />

                    <label htmlFor={`kernelInitializerSelect`} className="block text-sm font-medium text-gray-700">Kernel Initializer:</label>
                    <select
                        id={`kernelInitializerSelect`}
                        name="kernelInitializer"
                        value={denseConfig.kernelInitializer || 'varianceScaling'}
                        onChange={(e) => updateConv2dConfig(index, { kernelInitializer: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;"
                    >
                        <option value="varianceScaling">Variance Scaling</option>
                    </select>

                    <label htmlFor={"activation"} className="block text-sm font-medium text-gray-700"> activation </label>
                    <select
                        id={"activation"}
                        name="activation"
                        value={denseConfig.activation || 'relu'}
                        onChange={(e) => updateDenseConfig({ activation: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;"
                    >
                        <option value="relu">ReLU</option>
                        <option value="sigmoid">Sigmoid</option>
                        <option value="softmax">Softmax</option>
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

export default dense;



