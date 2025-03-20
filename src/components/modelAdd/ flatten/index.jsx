import React, { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';

function flatten(){

    return (
        <div className="text-updater-node bg-white shadow-lg rounded-lg p-6 w-80">
            <Handle
                type="target"
                position={Position.Top}
                className="w-4 h-4 bg-gray-300 rounded-full"
            />
           <div>
            
           <label htmlFor=" flatten" className="block text-sm font-medium text-gray-700">  flatten </label>
           
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

export default flatten;



