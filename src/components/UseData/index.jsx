import React, { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '@/store'

function UseData() {
    const onChange = useStore((state) => state.useData)
    const isData = useStore((state) => state.isData) 
    const changeData = useStore((state) => state.changeData)
    const cons = () => {
        changeData()
        console.log(isData)
    }

    return (
        <div className="bg-white shadow-lg rounded-lg p-6 w-80">
            <div >
                <label htmlFor="dataSelect" className="block text-sm font-medium text-gray-700">训练数据:</label>
                <select id="dataSelect" name="dataSelect" onChange={onChange} className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;">
                    <option value="handwriting">MNIST</option>
                </select>
                <button onClick={cons}>确认</button>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                id="b"
                className='w-4 h-4 bg-gray-300 rounded-full'
            />
        </div>
    );
}

export default UseData;



