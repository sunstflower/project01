import React, { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '@/store'

const handleStyle = { left: 10 };

function UseData() {
    const onChange = useStore((state) => state.useData)
    const isData = useStore((state) => state.isData) 
    const changeData = useStore((state) => state.changeData)
    const cons = () => {
        changeData()
        console.log(isData)
    }

    return (
        <div className="text-updater-node">
            <Handle
                type="target"
                position={Position.Top}
            />
            <div >
                <label htmlFor="dataSelect">训练数据:</label>
                <select id="dataSelect" name="dataSelect" onChange={onChange} className="nodrag">
                    <option value="handwriting">MNIST</option>
                </select>
                <button onClick={cons}>确认</button>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                id="a"
                style={handleStyle}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="b"
            />
        </div>
    );
}

export default UseData;



