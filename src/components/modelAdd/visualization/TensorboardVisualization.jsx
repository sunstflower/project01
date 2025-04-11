import React, { useState } from 'react';
import EnhancedVisualization from './EnhancedVisualization';
import FeatureVisualization from './FeatureVisualization';

// TensorBoard样式的标签页接口
const TensorboardVisualization = ({ trainingHistory, model, testData }) => {
  const [activeTab, setActiveTab] = useState('scalars');
  const [sampleImage, setSampleImage] = useState(null);

  // 从测试数据中提取一个样本图像用于特征可视化
  const extractSampleImage = () => {
    if (!testData || !testData.xs) return null;
    
    try {
      // 获取第一个测试样本
      return testData.xs.slice([0, 0, 0, 0], [1, -1, -1, -1]);
    } catch (error) {
      console.error('提取样本图像出错:', error);
      return null;
    }
  };

  // 模拟TensorBoard的导航结构
  const tabs = [
    { id: 'scalars', label: '标量' },
    { id: 'images', label: '图像' },
    { id: 'features', label: '特征图' },
    { id: 'graphs', label: '图表' },
    { id: 'distributions', label: '分布' },
    { id: 'histograms', label: '直方图' },
    { id: 'text', label: '文本' },
  ];

  // 根据当前激活的标签页渲染不同的内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'scalars':
        return <EnhancedVisualization 
                 trainingHistory={trainingHistory} 
                 model={model} 
                 testData={testData} 
               />;
      case 'images':
        return <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-semibold mb-4 text-gray-800">图像可视化</h3>
                 <p className="text-gray-600">在这里可以显示模型的输入图像样本。</p>
                 {testData && testData.xs && (
                   <div className="image-samples mt-4">
                     <h4 className="text-lg font-medium mb-3">测试样本</h4>
                     <div className="grid grid-cols-5 gap-2">
                       {/* 这里可以添加图像样本的实际渲染 */}
                       <div className="bg-gray-100 p-2 rounded">示例图像占位符</div>
                       <div className="bg-gray-100 p-2 rounded">示例图像占位符</div>
                       <div className="bg-gray-100 p-2 rounded">示例图像占位符</div>
                     </div>
                   </div>
                 )}
               </div>;
      case 'features':
        // 提取样本图像用于特征可视化
        const inputImage = sampleImage || extractSampleImage();
        if (inputImage) {
          setSampleImage(inputImage);
        }
        
        return <FeatureVisualization 
                 model={model} 
                 inputImage={inputImage} 
               />;
      case 'graphs':
        return <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-semibold mb-4 text-gray-800">模型图表</h3>
                 <p className="text-gray-600">这里可以展示模型的计算图结构。</p>
                 {model && (
                   <div className="model-structure mt-4 p-4 bg-gray-50 rounded-lg">
                     <h4 className="text-lg font-medium mb-3">模型结构</h4>
                     <pre className="text-sm overflow-auto max-h-96 p-2 bg-gray-100 rounded">
                       {JSON.stringify(model.toJSON(), null, 2)}
                     </pre>
                   </div>
                 )}
               </div>;
      case 'distributions':
        return <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-semibold mb-4 text-gray-800">权重分布</h3>
                 <p className="text-gray-600">这里可以展示模型各层权重的分布情况。</p>
                 <div className="placeholder mt-4 p-20 bg-gray-50 rounded-lg flex items-center justify-center">
                   <p className="text-gray-500">权重分布可视化（待实现）</p>
                 </div>
               </div>;
      case 'histograms':
        return <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-semibold mb-4 text-gray-800">权重直方图</h3>
                 <p className="text-gray-600">这里可以展示模型各层权重的直方图分布。</p>
                 <div className="placeholder mt-4 p-20 bg-gray-50 rounded-lg flex items-center justify-center">
                   <p className="text-gray-500">权重直方图可视化（待实现）</p>
                 </div>
               </div>;
      case 'text':
        return <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-semibold mb-4 text-gray-800">训练日志</h3>
                 <p className="text-gray-600">显示训练过程中的关键信息和日志。</p>
                 {trainingHistory && (
                   <div className="training-log mt-4 p-4 bg-gray-50 rounded-lg">
                     <h4 className="text-lg font-medium mb-3">训练历史</h4>
                     <div className="text-sm overflow-auto max-h-96 p-2 bg-gray-100 rounded font-mono">
                       <p>开始训练模型...</p>
                       {trainingHistory.history.loss.map((loss, epoch) => (
                         <p key={epoch} className="mb-1">
                           Epoch {epoch+1}/{trainingHistory.history.loss.length}: 
                           loss={loss.toFixed(4)} - 
                           acc={trainingHistory.history.acc[epoch].toFixed(4)} - 
                           val_loss={trainingHistory.history.val_loss[epoch].toFixed(4)} - 
                           val_acc={trainingHistory.history.val_acc[epoch].toFixed(4)}
                         </p>
                       ))}
                       <p>训练完成！</p>
                     </div>
                   </div>
                 )}
               </div>;
      default:
        return <div>未知标签页</div>;
    }
  };

  return (
    <div className="tensorboard-visualization">
      {/* TensorBoard风格的头部 */}
      <div className="header bg-gray-800 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center">
          <svg viewBox="0 0 32 32" className="h-8 w-8 mr-2">
            <path 
              fill="#FF6F00" 
              d="M16,32C7.178,32,0,24.822,0,16S7.178,0,16,0s16,7.178,16,16S24.822,32,16,32z M16,2C8.268,2,2,8.268,2,16 s6.268,14,14,14s14-6.268,14-14S23.732,2,16,2z"
            />
            <path 
              fill="#FF6F00" 
              d="M22,16l-10,6V10L22,16z"
            />
          </svg>
          <h2 className="text-xl font-semibold">TensorBoard 可视化</h2>
        </div>
        <div className="text-sm text-gray-300">
          {trainingHistory && `训练: ${trainingHistory.history.loss.length} epochs`}
        </div>
      </div>
      
      {/* 标签页导航 */}
      <div className="tabs bg-gray-200 p-2 flex space-x-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200
              ${activeTab === tab.id 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-300'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* 标签页内容 */}
      <div className="tab-content p-4 bg-gray-100 rounded-b-lg min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default TensorboardVisualization; 