import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '@/store';
import Papa from 'papaparse';
import { createTensorsFromCSV } from '@/tfjs/data';
import styles from './UseData.module.css';

function UseData({ id, data }) {
    const { setNodeData } = useStore();
    const [selectedOption, setSelectedOption] = useState('mnist');
    const [csvFile, setCsvFile] = useState(null);
    const [csvSummary, setCsvSummary] = useState(null);
    const [processingStatus, setProcessingStatus] = useState(null);
    
    // Advanced data options
    const [targetColumn, setTargetColumn] = useState('');
    const [isTimeSeries, setIsTimeSeries] = useState(false);
    const [timeSteps, setTimeSteps] = useState(1);
    const [predictSteps, setPredictSteps] = useState(1);
    const [outputShape, setOutputShape] = useState('2d');
    const [splitRatio, setSplitRatio] = useState(0.8);
    const [normalizeData, setNormalizeData] = useState(true);
    
    // Column type states
    const [numericColumns, setNumericColumns] = useState([]);
    const [categoricalColumns, setCategoricalColumns] = useState([]);

    // Handle data option change
    const handleSelectChange = useCallback((e) => {
        setSelectedOption(e.target.value);
        if (e.target.value === 'mnist') {
            setNodeData(id, { dataType: 'mnist' });
        } else {
            // Reset CSV data when switching to CSV option
            setCsvFile(null);
            setCsvSummary(null);
            setProcessingStatus(null);
            setTargetColumn('');
        }
    }, [id, setNodeData]);

    // Handle file upload
    const handleFileUpload = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setCsvFile(file);
        setProcessingStatus('Parsing CSV file...');
        
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors && results.errors.length > 0) {
                    setProcessingStatus(`Error parsing CSV: ${results.errors[0].message}`);
                    return;
                }
                
                if (!results.data || results.data.length === 0) {
                    setProcessingStatus('CSV file is empty or invalid');
                    return;
                }
                
                // Analyze column types
                const columns = results.meta.fields || Object.keys(results.data[0]);
                const { numericCols, categoricalCols } = checkColumnTypes(results.data, columns);
                
                setNumericColumns(numericCols);
                setCategoricalColumns(categoricalCols);
                
                // Set first numeric column as default target
                if (numericCols.length > 0 && !targetColumn) {
                    setTargetColumn(numericCols[0]);
                }
                
                // Create summary
                const summary = {
                    rowCount: results.data.length,
                    columnCount: columns.length,
                    columns: columns,
                    sampleRow: results.data[0],
                    numericColumns: numericCols,
                    categoricalColumns: categoricalCols
                };
                
                setCsvSummary(summary);
                setProcessingStatus('CSV file parsed successfully');
            },
            error: (error) => {
                setProcessingStatus(`Error parsing CSV: ${error.message}`);
            }
        });
    }, [targetColumn]);

    // Check column types
    const checkColumnTypes = useCallback((data, columns) => {
        const numericCols = [];
        const categoricalCols = [];
        
        // Check first 10 rows to determine column types
        const sampleSize = Math.min(10, data.length);
        
        columns.forEach(col => {
            let isNumeric = true;
            
            for (let i = 0; i < sampleSize; i++) {
                const value = data[i][col];
                if (value === null || value === undefined) continue;
                
                if (typeof value !== 'number' && isNaN(parseFloat(value))) {
                    isNumeric = false;
                    break;
                }
            }
            
            if (isNumeric) {
                numericCols.push(col);
            } else {
                categoricalCols.push(col);
            }
        });
        
        return { numericCols, categoricalCols };
    }, []);

    // Process CSV data
    const processCSVData = useCallback(() => {
        if (!csvFile || !csvSummary) return null;
        
        try {
            return new Promise((resolve, reject) => {
                setProcessingStatus('Processing CSV data...');
                
                Papa.parse(csvFile, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        if (results.errors && results.errors.length > 0) {
                            reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
                            return;
                        }
                        
                        const data = results.data;
                        
                        // Validate target column
                        if (!targetColumn) {
                            reject(new Error('Please select a target column'));
                            return;
                        }
                        
                        // Validate time series settings
                        if (isTimeSeries && (timeSteps < 1 || predictSteps < 1)) {
                            reject(new Error('Time steps and predict steps must be at least 1'));
                            return;
                        }
                        
                        if (isTimeSeries && data.length < timeSteps + predictSteps) {
                            reject(new Error(`Time series data must have at least ${timeSteps + predictSteps} rows`));
                            return;
                        }
                        
                        setProcessingStatus('Creating tensors from data...');
                        
                        // Create tensors
                        const options = {
                            targetColumn,
                            isTimeSeries,
                            timeSteps: parseInt(timeSteps, 10),
                            predictSteps: parseInt(predictSteps, 10),
                            outputShape,
                            splitRatio: parseFloat(splitRatio),
                            normalize: normalizeData
                        };
                        
                        try {
                            const tensorData = createTensorsFromCSV(data, options);
                            
                            if (!tensorData.xs || !tensorData.labels) {
                                reject(new Error('Failed to create tensors from CSV data'));
                                return;
                            }
                            
                            resolve(tensorData);
                        } catch (err) {
                            reject(new Error(`Tensor creation error: ${err.message}`));
                        }
                    },
                    error: (error) => {
                        reject(new Error(`CSV parsing error: ${error.message}`));
                    }
                });
            });
        } catch (error) {
            setProcessingStatus(`Error: ${error.message}`);
            return null;
        }
    }, [csvFile, csvSummary, targetColumn, isTimeSeries, timeSteps, predictSteps, outputShape, splitRatio, normalizeData]);

    // Confirm data usage
    const confirmData = useCallback(async () => {
        try {
            if (selectedOption === 'mnist') {
                setNodeData(id, { dataType: 'mnist' });
                setProcessingStatus('MNIST data selected');
            } else if (selectedOption === 'csv') {
                if (!csvFile) {
                    setProcessingStatus('Error: Please upload a CSV file');
                    return;
                }
                
                setProcessingStatus('Processing CSV data...');
                const tensorData = await processCSVData();
                
                if (!tensorData) {
                    setProcessingStatus('Error: Failed to process CSV data');
                    return;
                }
                
                // Extract metadata from tensors
                const inputShape = tensorData.xs.shape.slice(1);
                const outputShape = tensorData.labels.shape.slice(1);
                
                setNodeData(id, {
                    dataType: 'csv',
                    tensors: tensorData,
                    targetColumn,
                    isTimeSeries,
                    timeSteps: parseInt(timeSteps),
                    predictSteps: parseInt(predictSteps),
                    outputFormat: outputShape,
                    inputShape,
                    outputShape,
                    metadata: tensorData.meta || {}
                });
                
                setProcessingStatus('CSV data processed successfully');
            }
        } catch (error) {
            setProcessingStatus(`Error: ${error.message}`);
            console.error('Data confirmation error:', error);
        }
    }, [id, selectedOption, csvFile, processCSVData, setNodeData, targetColumn, isTimeSeries, timeSteps, predictSteps, outputShape]);

    return (
        <div className={styles.dataNode}>
            <div className={styles.nodeHeader}>Data Source</div>
            
            <div className={styles.nodeContent}>
                <div className={styles.optionGroup}>
                    <label htmlFor="dataOption">Data Type:</label>
                <select 
                        id="dataOption" 
                    value={selectedOption} 
                    onChange={handleSelectChange} 
                        className={styles.select}
                >
                        <option value="mnist">MNIST (Default)</option>
                        <option value="csv">CSV Upload</option>
                </select>
                </div>
                
                {selectedOption === 'csv' && (
                    <>
                        <div className={styles.fileUpload}>
                            <label htmlFor="csvFileUpload" className={styles.fileLabel}>
                                Upload CSV File
                            </label>
                        <input 
                            type="file" 
                                id="csvFileUpload"
                            accept=".csv" 
                            onChange={handleFileUpload}
                                className={styles.fileInput}
                        />
                            {csvFile && <span className={styles.fileName}>{csvFile.name}</span>}
                        </div>
                        
                        {processingStatus && (
                            <div className={styles.statusMessage}>
                                {processingStatus}
                            </div>
                        )}
                        
                        {csvSummary && (
                            <>
                                <div className={styles.csvSummary}>
                                    <h4>CSV Summary</h4>
                                    <p>Rows: {csvSummary.rowCount}, Columns: {csvSummary.columnCount}</p>
                                    
                                    <div className={styles.columnTypes}>
                                        <div>
                                            <strong>Numeric Columns:</strong> 
                                            {numericColumns.length > 0 ? 
                                                numericColumns.join(', ') : 
                                                'None detected'}
                                        </div>
                                        <div>
                                            <strong>Categorical Columns:</strong> 
                                            {categoricalColumns.length > 0 ? 
                                                categoricalColumns.join(', ') : 
                                                'None detected'}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={styles.dataOptions}>
                                    <h4>Data Processing Options</h4>
                                    
                                    <div className={styles.optionGroup}>
                                        <label htmlFor="targetColumn">Target Column:</label>
                                        <select 
                                            id="targetColumn"
                                            value={targetColumn}
                                            onChange={(e) => setTargetColumn(e.target.value)}
                                            className={styles.select}
                                        >
                                            <option value="">Select Target Column</option>
                                            {numericColumns.map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className={styles.optionGroup}>
                                        <label htmlFor="isTimeSeries">
                                            <input
                                                type="checkbox"
                                                id="isTimeSeries"
                                                checked={isTimeSeries}
                                                onChange={(e) => setIsTimeSeries(e.target.checked)}
                                            />
                                            Time Series Data
                                        </label>
                                    </div>
                                    
                                    {isTimeSeries && (
                                        <>
                                            <div className={styles.optionGroup}>
                                                <label htmlFor="timeSteps">Time Steps:</label>
                                                <input
                                                    type="number"
                                                    id="timeSteps"
                                                    min="1"
                                                    value={timeSteps}
                                                    onChange={(e) => setTimeSteps(e.target.value)}
                                                    className={styles.numberInput}
                                                />
                                            </div>
                                            
                                            <div className={styles.optionGroup}>
                                                <label htmlFor="predictSteps">Predict Steps:</label>
                                                <input
                                                    type="number"
                                                    id="predictSteps"
                                                    min="1"
                                                    value={predictSteps}
                                                    onChange={(e) => setPredictSteps(e.target.value)}
                                                    className={styles.numberInput}
                                                />
                                            </div>
                                        </>
                                    )}
                                    
                                    <div className={styles.optionGroup}>
                                        <label htmlFor="outputShape">Output Shape:</label>
                                        <select
                                            id="outputShape"
                                            value={outputShape}
                                            onChange={(e) => setOutputShape(e.target.value)}
                                            className={styles.select}
                                        >
                                            <option value="2d">2D (Standard)</option>
                                            <option value="3d">3D (For RNN/LSTM)</option>
                                        </select>
                                    </div>
                                    
                                    <div className={styles.optionGroup}>
                                        <label htmlFor="splitRatio">Train/Test Split:</label>
                                        <input
                                            type="range"
                                            id="splitRatio"
                                            min="0.5"
                                            max="0.9"
                                            step="0.05"
                                            value={splitRatio}
                                            onChange={(e) => setSplitRatio(e.target.value)}
                                            className={styles.rangeInput}
                                        />
                                        <span>{Math.round(splitRatio * 100)}% / {Math.round((1-splitRatio) * 100)}%</span>
                                    </div>
                                    
                                    <div className={styles.optionGroup}>
                                        <label htmlFor="normalizeData">
                                            <input
                                                type="checkbox"
                                                id="normalizeData"
                                                checked={normalizeData}
                                                onChange={(e) => setNormalizeData(e.target.checked)}
                                            />
                                            Normalize Data
                                        </label>
                                    </div>
                            </div>
                            </>
                        )}
                    </>
                )}
                
                <button 
                    onClick={confirmData} 
                    className={styles.confirmButton}
                    disabled={selectedOption === 'csv' && !csvFile}
                >
                    Confirm Data
                </button>
            </div>
            
            <Handle
                type="source"
                position="right"
                id="output"
                style={{ background: '#555' }}
            />
        </div>
    );
}

export default UseData;



