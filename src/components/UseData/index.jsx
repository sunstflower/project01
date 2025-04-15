import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '@/store';
import Papa from 'papaparse';
import { createTensorsFromCSV } from '@/tfjs/data';

function UseData() {
    const { changeData, isData } = useStore();
    const [selectedOption, setSelectedOption] = useState('handwriting');
    const [csvFile, setCsvFile] = useState(null);
    const [csvSummary, setCsvSummary] = useState(null);
    const [processingStatus, setProcessingStatus] = useState('');
    const [numericColumns, setNumericColumns] = useState([]);
    const [totalColumns, setTotalColumns] = useState(0);
    
    // 新增：数据处理选项
    const [dataOptions, setDataOptions] = useState({
        targetColumn: '',
        isTimeSeries: false, 
        timeSteps: 1,
        outputShape: '3d'  // 3d输出更适合大多数网络
    });

    const handleSelectChange = (event) => {
        setSelectedOption(event.target.value);
        if (event.target.value !== 'csv') {
            setCsvFile(null);
            setCsvSummary(null);
            setNumericColumns([]);
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setCsvFile(file);
            setProcessingStatus('正在分析CSV文件...');
            parseCsv(file);
        }
    };

    // 检查一个值是否为数值
    const isNumeric = (value) => {
        return !isNaN(parseFloat(value)) && isFinite(value);
    };

    // 检查列是否为数值类型
    const checkColumnType = (data, columnName) => {
        if (!data || data.length === 0) return false;
        
        // 检查前10行或所有行（如果少于10行）
        const rowsToCheck = Math.min(data.length, 10);
        let numericCount = 0;
        
        for (let i = 0; i < rowsToCheck; i++) {
            if (isNumeric(data[i][columnName])) {
                numericCount++;
            }
        }
        
        // 如果超过80%的值是数值，则认为是数值列
        return (numericCount / rowsToCheck) > 0.8;
    };

    // 处理CSV数据预处理
    const preprocessCsvData = (data) => {
        if (!data || data.length === 0) {
            setProcessingStatus('CSV数据为空');
            return [];
        }

        // 识别所有列
        const columnNames = Object.keys(data[0]);
        setTotalColumns(columnNames.length);
        
        // 识别数值列
        const numericCols = columnNames.filter(col => checkColumnType(data, col));
        setNumericColumns(numericCols);
        
        // 如果有数值列，默认设置第一个为目标列
        if (numericCols.length > 0) {
            setDataOptions(prev => ({
                ...prev,
                targetColumn: numericCols[0]
            }));
        }
        
        // 预处理数据 - 确保所有数值列都是数字类型
        const processedData = data.map(row => {
            const processedRow = {...row};
            numericCols.forEach(col => {
                processedRow[col] = parseFloat(row[col]) || 0;
            });
            return processedRow;
        });

        const summary = {
            totalRows: data.length,
            totalColumns: columnNames.length,
            numericColumns: numericCols.length,
            nonNumericColumns: columnNames.length - numericCols.length,
            columnNames: columnNames,
            numericColumnNames: numericCols,
            sampleSize: Math.min(data.length, 5)
        };
        
        setCsvSummary(summary);
        setProcessingStatus(`CSV分析完成: ${numericCols.length}个数值列，可用于训练`);
        
        return processedData;
    };

    const parseCsv = (file) => {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true, // 自动转换数值
            complete: (results) => {
                console.log('Parsed CSV data:', results);
                
                if (results.errors && results.errors.length > 0) {
                    console.error('CSV parsing errors:', results.errors);
                    setProcessingStatus(`解析错误: ${results.errors[0].message}`);
                    return;
                }
                
                const processedData = preprocessCsvData(results.data);
                
                // 只存储原始CSV数据，在确认时再处理为张量
                changeData(processedData);
            },
            error: (error) => {
                console.error('Error parsing CSV:', error);
                setProcessingStatus(`解析错误: ${error.message}`);
            }
        });
    };

    // 处理数据选项变更
    const handleOptionsChange = (e) => {
        const { name, value, type, checked } = e.target;
        setDataOptions(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleConfirm = () => {
        try {
            if (selectedOption === 'handwriting') {
                // 处理MNIST数据集
                changeData([]);
                setProcessingStatus('已选择MNIST数据集');
            } else if (selectedOption === 'csv' && csvFile) {
                const processedData = useStore.getState().csvData;
                
                if (!processedData || processedData.length === 0) {
                    setProcessingStatus('没有有效的CSV数据');
                    return;
                }
                
                // 使用增强的处理函数，创建张量并存储元数据
                const options = {
                    ...dataOptions,
                    timeSteps: parseInt(dataOptions.timeSteps, 10)
                };
                
                console.log('Processing CSV data with options:', options);
                
                // 创建张量并保存
                const tensorData = createTensorsFromCSV(processedData, options);
                
                if (tensorData.error) {
                    throw new Error(tensorData.error.message);
                }
                
                if (!tensorData.xs || !tensorData.labels) {
                    throw new Error('无法创建有效的张量数据');
                }
                
                console.log('Created tensor data:', tensorData);
                
                // 在Store中更新数据
                changeData({
                    ...tensorData,
                    originalData: processedData,
                    options: options
                });
                
                setProcessingStatus(`已处理CSV数据，创建了形状为 ${tensorData.xs.shape} 的输入张量`);
            } else {
                setProcessingStatus('请先选择或上传数据');
            }
        } catch (error) {
            console.error('Error processing data:', error);
            setProcessingStatus(`数据处理错误: ${error.message}`);
        }
    };

    return (
        <div className="bg-white shadow-lg rounded-lg p-6 w-80">
            <div>
                <label htmlFor="dataSelect" className="block text-sm font-medium text-gray-700 mb-2">训练数据类型:</label>
                <select 
                    id="dataSelect" 
                    name="dataSelect" 
                    value={selectedOption} 
                    onChange={handleSelectChange} 
                    className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                >
                    <option value="handwriting">MNIST手写数字</option>
                    <option value="csv">导入CSV数据</option>
                </select>
                
                {selectedOption === 'csv' && (
                    <div className="mt-3 mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">上传CSV文件:</label>
                        <input 
                            type="file" 
                            accept=".csv" 
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                        />
                        
                        {processingStatus && (
                            <p className="mt-2 text-sm text-gray-600">{processingStatus}</p>
                        )}
                        
                        {csvSummary && (
                            <div className="mt-3 mb-4">
                                <div className="p-3 bg-gray-50 rounded-md text-sm">
                                    <h4 className="font-medium text-gray-700 mb-1">CSV数据摘要:</h4>
                                    <p className="text-gray-600">行数: {csvSummary.totalRows}</p>
                                    <p className="text-gray-600">数值列: {csvSummary.numericColumns} / {csvSummary.totalColumns}</p>
                                    <p className="text-gray-600 mb-2">特征维度: {numericColumns.length}</p>
                                    <p className="text-gray-600 text-xs">
                                        <span className="font-medium">可用于训练的列:</span> {numericColumns.join(', ')}
                                    </p>
                                </div>
                                
                                {/* 数据处理选项 */}
                                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                                    <h4 className="font-medium text-blue-700 mb-2">数据处理选项:</h4>
                                    
                                    {/* 目标列选择 */}
                                    <div className="mb-3">
                                        <label className="block text-sm text-gray-700 mb-1">目标列:</label>
                                        <select 
                                            name="targetColumn"
                                            value={dataOptions.targetColumn}
                                            onChange={handleOptionsChange}
                                            className="w-full px-2 py-1 text-sm border rounded"
                                        >
                                            {numericColumns.map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">模型将预测此列值</p>
                                    </div>
                                    
                                    {/* 时间序列选项 */}
                                    <div className="mb-3">
                                        <div className="flex items-center mb-1">
                                            <input 
                                                type="checkbox"
                                                id="isTimeSeries"
                                                name="isTimeSeries"
                                                checked={dataOptions.isTimeSeries}
                                                onChange={handleOptionsChange}
                                                className="mr-2"
                                            />
                                            <label htmlFor="isTimeSeries" className="text-sm text-gray-700">
                                                时间序列数据
                                            </label>
                                        </div>
                                        
                                        {dataOptions.isTimeSeries && (
                                            <div className="ml-5 mt-1">
                                                <label className="block text-sm text-gray-700 mb-1">
                                                    时间步数:
                                                </label>
                                                <input 
                                                    type="number"
                                                    name="timeSteps"
                                                    value={dataOptions.timeSteps}
                                                    onChange={handleOptionsChange}
                                                    min="1"
                                                    max="10"
                                                    className="w-20 px-2 py-1 text-sm border rounded"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* 输出形状选项 */}
                                    <div className="mb-2">
                                        <label className="block text-sm text-gray-700 mb-1">输出形状:</label>
                                        <select 
                                            name="outputShape"
                                            value={dataOptions.outputShape}
                                            onChange={handleOptionsChange}
                                            className="w-full px-2 py-1 text-sm border rounded"
                                        >
                                            <option value="2d">2D (样本, 特征)</option>
                                            <option value="3d">3D (样本, 时间步, 特征)</option>
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            3D形状适用于CNN/RNN, 2D形状适用于Dense网络
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                <button 
                    onClick={handleConfirm} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-150 ease-in-out"
                >
                    确认使用数据
                </button>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                id="b"
                className="w-4 h-4 bg-gray-300 rounded-full"
            />
        </div>
    );
}

export default UseData;



