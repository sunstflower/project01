import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '@/store';
import Papa from 'papaparse';

function UseData() {
    const changeData = useStore((state) => state.changeData);
    const [selectedOption, setSelectedOption] = useState('handwriting');
    const [csvFile, setCsvFile] = useState(null);

    const handleSelectChange = (event) => {
        setSelectedOption(event.target.value);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setCsvFile(file);
            parseCsv(file);
        }
    };

    const parseCsv = (file) => {
        Papa.parse(file, {
            header: true,
            complete: (results) => {
                console.log('Parsed data:', results.data);
                // 更新 store 中的 csvData
                changeData(results.data);
            },
            error: (error) => {
                console.error('Error parsing CSV:', error);
            }
        });
    };

    const cons = () => {
        console.log('Confirm button clicked');
    };

    return (
        <div className="bg-white shadow-lg rounded-lg p-6 w-80">
            <div>
                <label htmlFor="dataSelect" className="block text-sm font-medium text-gray-700">训练数据:</label>
                <select id="dataSelect" name="dataSelect" value={selectedOption} onChange={handleSelectChange} className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="handwriting">MNIST</option>
                    <option value="csv">使用csv</option>
                </select>
                {selectedOption === 'csv' && (
                    <div className="mt-4">
                        <input type="file" accept=".csv" onChange={handleFileUpload} />
                    </div>
                )}
                <button onClick={cons} className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    确认
                </button>
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



