import React, { useState, useEffect } from 'react';
import NodeContainer from '../NodeContainer';
import useStore from '@/store';

function ReshapeNode({ data }) {
    const { 
        reshapeConfigs, 
        updateReshapeConfig,
        csvData
    } = useStore();
    
    const configIndex = data.index || 0;
    const [targetShape, setTargetShape] = useState('(None, 7, 4)');
    const [inputFeatures, setInputFeatures] = useState(4);
    const [selectedTemplate, setSelectedTemplate] = useState('time-series');
    const [dataSourceType, setDataSourceType] = useState('unknown');
    
    // 定义预设的形状模板
    const shapeTemplates = [
        { id: 'time-series', name: '时间序列', shape: '(None, 7, 4)' },
        { id: 'image-28', name: '图像 28x28', shape: '(28, 28, 1)' },
        { id: 'image-32', name: '图像 32x32', shape: '(32, 32, 3)' },
        { id: 'vector-1d', name: '一维向量', shape: '(784)' },
        { id: 'csv-auto', name: 'CSV数据 (自动)', shape: '' }
    ];
    
    // 检测CSV数据
    useEffect(() => {
        // 检查是否有CSV数据可用
        if (csvData && csvData.length > 0) {
            setDataSourceType('csv');
            
            // 检查数值列的数量
            if (csvData[0]) {
                const numericColumns = Object.keys(csvData[0]).filter(key => 
                    typeof csvData[0][key] === 'number' || !isNaN(parseFloat(csvData[0][key]))
                );
                
                if (numericColumns.length > 0) {
                    setInputFeatures(numericColumns.length);
                    
                    // 自动设置适合CSV数据的形状
                    const autoShape = `(None, ${Math.ceil(numericColumns.length/2)}, 2)`;
                    
                    // 如果当前使用CSV自动模板，则更新形状
                    if (selectedTemplate === 'csv-auto') {
                        setTargetShape(autoShape);
                        updateReshapeConfig(configIndex, { 
                            targetShape: autoShape,
                            inputFeatures: numericColumns.length 
                        });
                    }
                }
            }
        } else {
            setDataSourceType('mnist');
        }
    }, [csvData, configIndex, updateReshapeConfig, selectedTemplate]);
    
    // 初始化加载配置
    useEffect(() => {
        const config = reshapeConfigs[configIndex];
        if (config) {
            setTargetShape(config.targetShape || '(None, 7, 4)');
            setInputFeatures(config.inputFeatures || 4);
        }
    }, [configIndex, reshapeConfigs]);
    
    // 处理形状输入变化
    const handleShapeChange = (e) => {
        const newShape = e.target.value;
        setTargetShape(newShape);
        updateReshapeConfig(configIndex, { 
            targetShape: newShape,
            inputFeatures: inputFeatures
        });
    };
    
    // 处理输入特征变化
    const handleInputFeaturesChange = (e) => {
        const newFeatures = parseInt(e.target.value) || 4;
        setInputFeatures(newFeatures);
        updateReshapeConfig(configIndex, { 
            targetShape: targetShape,
            inputFeatures: newFeatures 
        });
    };
    
    // 处理模板选择
    const handleTemplateChange = (e) => {
        const templateId = e.target.value;
        setSelectedTemplate(templateId);
        
        if (templateId === 'csv-auto' && csvData && csvData.length > 0) {
            // CSV数据自动模板
            const numericColumns = Object.keys(csvData[0]).filter(key => 
                typeof csvData[0][key] === 'number' || !isNaN(parseFloat(csvData[0][key]))
            );
            
            if (numericColumns.length > 0) {
                // 自动设置适合数据的形状
                const newFeatures = numericColumns.length;
                const newShape = `(None, ${Math.ceil(newFeatures/2)}, 2)`;
                
                setInputFeatures(newFeatures);
                setTargetShape(newShape);
                updateReshapeConfig(configIndex, { 
                    targetShape: newShape,
                    inputFeatures: newFeatures 
                });
                return;
            }
        }
        
        // 其他预定义模板
        const template = shapeTemplates.find(t => t.id === templateId);
        if (template && template.shape) {
            setTargetShape(template.shape);
            updateReshapeConfig(configIndex, { 
                targetShape: template.shape,
                inputFeatures: inputFeatures 
            });
        }
    };

    return (
        <NodeContainer title="Reshape" backgroundColor="indigo-50">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">形状模板:</label>
                    <select 
                        value={selectedTemplate}
                        onChange={handleTemplateChange}
                        className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {shapeTemplates.map(template => (
                            <option key={template.id} value={template.id}>
                                {template.name}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                        选择预设形状模板，或自定义下方的目标形状。
                    </p>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">目标形状:</label>
                    <input 
                        type="text" 
                        value={targetShape}
                        onChange={handleShapeChange}
                        placeholder="(None, 7, 4)"
                        className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        格式: (None, 7, 4) 表示任意批量大小，7个时间步，4个特征
                    </p>
                    
                    {dataSourceType === 'csv' && (
                        <div className="mt-1 text-xs text-blue-600">
                            检测到CSV数据，建议使用CSV自动模板或确保形状兼容输入特征数。
                        </div>
                    )}
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">输入特征数:</label>
                    <input 
                        type="number" 
                        value={inputFeatures}
                        onChange={handleInputFeaturesChange}
                        min="1" 
                        max="1000"
                        className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        输入特征的数量。对于CSV数据，这通常是数值列的数量。
                    </p>
                    
                    {dataSourceType === 'csv' && csvData && csvData.length > 0 && (
                        <div className="mt-1 text-xs text-green-600">
                            检测到 {inputFeatures} 个数值特征
                        </div>
                    )}
                </div>
                
                <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-800">
                    <p className="font-medium">提示:</p>
                    <p>1. 确保输出形状的元素总数与输入特征数一致</p>
                    <p>2. 使用 "None" 表示动态维度(如批量大小)</p>
                    <p>3. 时间序列数据通常使用 (None, 时间步, 特征) 格式</p>
                </div>
            </div>
        </NodeContainer>
    );
}

export default ReshapeNode;