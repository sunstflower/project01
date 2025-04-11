import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import Plotly from 'plotly.js-dist';

const FeatureVisualization = ({ model, inputImage }) => {
  const [activations, setActivations] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [convLayers, setConvLayers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const activationGridRef = useRef(null);
  
  // 找出所有卷积层
  useEffect(() => {
    if (!model) return;
    
    try {
      console.log('Model layers:', model.layers.map(l => l.name + ' (' + l.getClassName() + ')'));
      
      const convs = [];
      // 寻找所有类型的卷积层
      model.layers.forEach((layer, index) => {
        const className = layer.getClassName().toLowerCase();
        // 包括standard conv2d和depthwiseconv2d等类型
        if (className.includes('conv')) {
          convs.push({
            index,
            name: layer.name,
            className: layer.getClassName()
          });
        }
      });
      
      console.log('Found convolutional layers:', convs.length);
      setConvLayers(convs);
      
      if (convs.length > 0) {
        setSelectedLayer(convs[0]);
      }
    } catch (err) {
      console.error('查找卷积层时出错:', err);
      setError('查找卷积层时出错: ' + err.message);
    }
  }, [model]);
  
  // 当选择一个卷积层时，提取并可视化其激活
  useEffect(() => {
    if (!model || !inputImage || !selectedLayer) return;
    
    setLoading(true);
    setError(null);
    
    const visualizeActivations = async () => {
      try {
        console.log('Visualizing activations for layer:', selectedLayer.name);
        console.log('Input image shape:', inputImage.shape);
        
        // 创建中间模型，从输入到选定的卷积层
        const intermediateModel = tf.model({
          inputs: model.inputs,
          outputs: model.layers[selectedLayer.index].output
        });
        
        // 获取该层的激活
        console.log('Predicting activations...');
        const activation = intermediateModel.predict(inputImage);
        console.log('Activation shape:', activation.shape);
        
        // 如果激活是空的或形状无效，显示错误
        if (!activation || activation.size === 0) {
          throw new Error('获取到的激活数据为空');
        }
        
        // 提取激活数据
        const activationData = await activation.array();
        
        // 处理不同维度的激活数据
        let channels = 0;
        if (activationData[0] && activationData[0].length > 0) {
          if (activationData[0][0] && activationData[0][0].length > 0) {
            if (activationData[0][0][0] && Array.isArray(activationData[0][0][0])) {
              // 4D数据 [batch, height, width, channels]
              channels = activationData[0][0][0].length;
            } else {
              // 3D数据 [batch, height, width] - 单通道
              channels = 1;
            }
          }
        }
        
        console.log('Number of activation channels:', channels);
        
        if (channels === 0) {
          throw new Error('无法确定激活通道数');
        }
        
        // 保存激活数据
        const activationMaps = [];
        
        // 限制可视化的通道数量
        const maxChannels = Math.min(channels, 16);
        
        // 对于单通道数据的特殊处理
        if (channels === 1) {
          const channelData = await tf.tidy(() => {
            return activation.reshape([activation.shape[1], activation.shape[2]]);
          }).array();
          
          activationMaps.push({
            channel: 0,
            data: channelData
          });
        } else {
          // 多通道数据处理
          for (let i = 0; i < maxChannels; i++) {
            // 提取每个通道的激活图
            const channelData = await tf.tidy(() => {
              // 获取该通道的激活
              return tf.slice(activation, [0, 0, 0, i], [1, -1, -1, 1])
                .reshape([activation.shape[1], activation.shape[2]]);
            }).array();
            
            activationMaps.push({
              channel: i,
              data: channelData
            });
          }
        }
        
        console.log('Created activation maps:', activationMaps.length);
        setActivations(activationMaps);
        
        // 绘制激活热力图
        if (activationGridRef.current && activationMaps.length > 0) {
          // 计算布局中的行列数
          const rows = Math.ceil(Math.sqrt(activationMaps.length));
          const cols = Math.ceil(activationMaps.length / rows);
          
          const subplots = [];
          const annotations = [];
          
          for (let i = 0; i < activationMaps.length; i++) {
            const row = Math.floor(i / cols) + 1;
            const col = (i % cols) + 1;
            
            subplots.push({
              data: [
                {
                  z: activationMaps[i].data,
                  type: 'heatmap',
                  colorscale: 'Viridis',
                  showscale: false,
                }
              ],
              xaxis: `x${i > 0 ? i + 1 : ''}`,
              yaxis: `y${i > 0 ? i + 1 : ''}`,
            });
            
            annotations.push({
              text: `通道 ${activationMaps[i].channel}`,
              font: { size: 10 },
              showarrow: false,
              x: 0.5 / cols + (col - 1) / cols,
              y: 1 - (0.5 / rows + (row - 1) / rows),
              xref: 'paper',
              yref: 'paper'
            });
          }
          
          const layout = {
            grid: {
              rows,
              columns: cols,
              pattern: 'independent'
            },
            annotations,
            title: `${selectedLayer.name} 层的激活图`,
            showlegend: false,
            margin: { l: 0, r: 0, b: 0, t: 40 },
          };
          
          // 展平子图数据结构
          const flattenedData = subplots.map(subplot => subplot.data[0]);
          
          try {
            Plotly.newPlot(activationGridRef.current, flattenedData, layout);
          } catch (plotlyError) {
            console.error('绘制激活图时出错:', plotlyError);
            setError('绘制激活图时出错: ' + plotlyError.message);
          }
        }
        
        // 释放资源
        activation.dispose();
      } catch (error) {
        console.error('可视化卷积层激活时出错:', error);
        setError('可视化卷积层激活时出错: ' + error.message);
        setActivations([]);
      } finally {
        setLoading(false);
      }
    };
    
    visualizeActivations();
  }, [model, inputImage, selectedLayer]);
  
  if (!model) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">特征可视化</h3>
        <p className="text-gray-600">请先加载模型。</p>
      </div>
    );
  }
  
  if (!inputImage) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">特征可视化</h3>
        <p className="text-gray-600">未能获取有效的输入图像。这可能是因为测试数据未正确加载或形状不匹配。</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">特征可视化</h3>
      
      {error && (
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
      )}
      
      {convLayers.length === 0 ? (
        <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
          未检测到卷积层。特征可视化仅适用于包含卷积层的模型。
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择卷积层:
            </label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md"
              value={selectedLayer ? selectedLayer.index : ''}
              onChange={(e) => {
                const index = parseInt(e.target.value);
                setSelectedLayer(convLayers.find(l => l.index === index));
              }}
            >
              {convLayers.map(layer => (
                <option key={layer.index} value={layer.index}>
                  {layer.name} ({layer.className})
                </option>
              ))}
            </select>
          </div>
          
          {selectedLayer && (
            <>
              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <h4 className="text-md font-medium mb-2">{selectedLayer.name}</h4>
                <p className="text-sm text-gray-600">
                  这些热力图显示了选定卷积层在每个通道上的激活响应。
                  颜色越亮表示神经元激活程度越高，反映了该区域对特定特征的响应强度。
                </p>
              </div>
              
              <div 
                ref={activationGridRef} 
                className="w-full h-[600px] bg-gray-50 rounded-lg"
              ></div>
              
              {loading && (
                <div className="flex justify-center items-center h-32 absolute inset-0 bg-gray-100 bg-opacity-50">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600">加载激活图...</span>
                </div>
              )}
              
              {!loading && activations.length === 0 && !error && (
                <div className="flex justify-center items-center h-32">
                  <p className="text-gray-500">未能生成激活图。可能需要选择不同的层。</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default FeatureVisualization; 