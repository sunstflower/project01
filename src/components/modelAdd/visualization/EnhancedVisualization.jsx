import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist';
import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';

const EnhancedVisualization = ({ trainingHistory, model, testData }) => {
  const lossChartRef = useRef(null);
  const accuracyChartRef = useRef(null);
  const confusionMatrixRef = useRef(null);
  const [evaluationMetrics, setEvaluationMetrics] = useState(null);
  const [error, setError] = useState(null);
  
  // 更新训练历史图表
  useEffect(() => {
    if (!trainingHistory || !trainingHistory.history) return;
    
    try {
      const history = trainingHistory.history;
      const epochs = Array.from(Array(history.loss.length).keys());
      
      // 绘制损失图表 - 类似TensorBoard的样式
      Plotly.newPlot(lossChartRef.current, [
        {
          x: epochs,
          y: history.loss,
          name: '训练损失',
          type: 'scatter',
          mode: 'lines',
          line: { color: '#FF6B6B', width: 2 }
        },
        {
          x: epochs,
          y: history.val_loss,
          name: '验证损失',
          type: 'scatter',
          mode: 'lines',
          line: { color: '#4ECDC4', width: 2 }
        }
      ], {
        title: {
          text: '模型损失',
          font: { family: 'Arial, sans-serif', size: 18 }
        },
        xaxis: { 
          title: '训练周期', 
          gridcolor: '#E4E4E4',
          zerolinecolor: '#E4E4E4'
        },
        yaxis: { 
          title: '损失值', 
          gridcolor: '#E4E4E4',
          zerolinecolor: '#E4E4E4'
        },
        margin: { l: 60, r: 30, t: 50, b: 50 },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        showlegend: true,
        legend: { orientation: 'h', y: -0.2 },
        autosize: true
      }, {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
      });
      
      // 绘制准确率图表
      Plotly.newPlot(accuracyChartRef.current, [
        {
          x: epochs,
          y: history.acc,
          name: '训练准确率',
          type: 'scatter',
          mode: 'lines',
          line: { color: '#FF6B6B', width: 2 }
        },
        {
          x: epochs,
          y: history.val_acc,
          name: '验证准确率',
          type: 'scatter',
          mode: 'lines',
          line: { color: '#4ECDC4', width: 2 }
        }
      ], {
        title: {
          text: '模型准确率',
          font: { family: 'Arial, sans-serif', size: 18 }
        },
        xaxis: { 
          title: '训练周期', 
          gridcolor: '#E4E4E4',
          zerolinecolor: '#E4E4E4'
        },
        yaxis: { 
          title: '准确率', 
          range: [0, 1], 
          gridcolor: '#E4E4E4',
          zerolinecolor: '#E4E4E4'
        },
        margin: { l: 60, r: 30, t: 50, b: 50 },
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        showlegend: true,
        legend: { orientation: 'h', y: -0.2 },
        autosize: true
      }, {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
      });
    } catch (err) {
      console.error('绘制训练历史图表时出错:', err);
      setError('绘制训练历史图表时出错: ' + err.message);
    }
  }, [trainingHistory]);
  
  // 评估模型并创建混淆矩阵
  useEffect(() => {
    if (!model || !testData || !testData.xs || !testData.ys) {
      console.log('缺少模型或测试数据，跳过评估');
      return;
    }
    
    const evaluateModel = async () => {
      try {
        console.log('开始评估模型...');
        console.log('测试数据形状 - xs:', testData.xs.shape, 'ys:', testData.ys.shape);
        console.log('模型输出形状:', model.outputs[0].shape);
        
        // 检查模型输出形状和测试标签形状是否匹配
        if (model.outputs[0].shape[1] !== testData.ys.shape[1]) {
          console.warn('模型输出形状与测试标签不匹配');
          console.warn('模型输出单元数:', model.outputs[0].shape[1]);
          console.warn('测试标签类别数:', testData.ys.shape[1]);
          
          // 在这种情况下，我们可以跳过混淆矩阵的生成，但仍然可以计算一些基本指标
          setEvaluationMetrics({
            loss: '无法计算',
            accuracy: '形状不匹配'
          });
          return;
        }
        
        // 计算模型评估指标
        const result = await model.evaluate(testData.xs, testData.ys);
        const loss = result[0].dataSync()[0];
        const accuracy = result[1].dataSync()[0];
        
        setEvaluationMetrics({
          loss: loss.toFixed(4),
          accuracy: (accuracy * 100).toFixed(2) + '%'
        });
        
        // 计算混淆矩阵
        const predictions = model.predict(testData.xs);
        
        try {
          const predictionArray = await predictions.argMax(1).array();
          const labelsArray = await testData.ys.argMax(1).array();
          
          // 创建混淆矩阵
          const numClasses = testData.ys.shape[1] || 10;
          const confusionMatrix = Array(numClasses).fill().map(() => Array(numClasses).fill(0));
          
          for (let i = 0; i < predictionArray.length; i++) {
            if (predictionArray[i] < numClasses && labelsArray[i] < numClasses) {
              confusionMatrix[labelsArray[i]][predictionArray[i]]++;
            }
          }
          
          // 绘制混淆矩阵
          const labels = Array.from(Array(numClasses).keys()).map(String);
          
          Plotly.newPlot(confusionMatrixRef.current, [{
            z: confusionMatrix,
            x: labels,
            y: labels,
            type: 'heatmap',
            colorscale: 'Blues',
            showscale: true,
            hoverongaps: false
          }], {
            title: {
              text: '混淆矩阵',
              font: { family: 'Arial, sans-serif', size: 18 }
            },
            annotations: confusionMatrix.map((row, i) => 
              row.map((value, j) => ({
                x: j,
                y: i,
                text: value,
                font: {color: value > (Math.max(...row) / 2) ? 'white' : 'black'},
                showarrow: false
              }))
            ).flat(),
            xaxis: { title: '预测类别' },
            yaxis: { title: '真实类别' },
            margin: { l: 60, r: 30, t: 50, b: 50 },
            paper_bgcolor: 'white',
            plot_bgcolor: 'white'
          });
        } catch (confusionError) {
          console.error('生成混淆矩阵出错:', confusionError);
          // 显示错误信息但不阻止其他部分的渲染
        }
        
        // 释放资源
        predictions.dispose();
      } catch (error) {
        console.error('模型评估出错:', error);
        setError('模型评估出错: ' + error.message);
        
        // 设置错误状态但仍然提供一些反馈
        setEvaluationMetrics({
          loss: '评估错误',
          accuracy: '评估错误'
        });
      }
    };
    
    evaluateModel();
  }, [model, testData]);
  
  if (error) {
    return (
      <div className="enhanced-visualization p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        
        {trainingHistory && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="chart-container p-4 bg-white rounded-lg shadow-md">
              <div ref={lossChartRef} className="h-80"></div>
            </div>
            <div className="chart-container p-4 bg-white rounded-lg shadow-md">
              <div ref={accuracyChartRef} className="h-80"></div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="enhanced-visualization p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="chart-container p-4 bg-white rounded-lg shadow-md">
          <div ref={lossChartRef} className="h-80"></div>
        </div>
        <div className="chart-container p-4 bg-white rounded-lg shadow-md">
          <div ref={accuracyChartRef} className="h-80"></div>
        </div>
      </div>
      
      {evaluationMetrics && (
        <div className="metrics-container mb-8 p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">模型评估</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="metric p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">测试损失</div>
              <div className="text-3xl font-bold text-blue-800">{evaluationMetrics.loss}</div>
            </div>
            <div className="metric p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 mb-1">测试准确率</div>
              <div className="text-3xl font-bold text-green-800">{evaluationMetrics.accuracy}</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="chart-container p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">混淆矩阵</h3>
        <div ref={confusionMatrixRef} className="h-96"></div>
      </div>
    </div>
  );
};

export default EnhancedVisualization; 