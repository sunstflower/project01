import React, { useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';
import { MnistData } from '@/tfjs/data.js'; // 确保路径正确
import useStore from '@/store'; // 确保路径正确

async function showExamples(data) {
  const surface = tfvis.visor().surface({ name: 'Input Data Examples', tab: 'Input Data' });
  const examples = data.nextTestBatch(20);
  const numExamples = examples.xs.shape[0];

  for (let i = 0; i < numExamples; i++) {
    const imageTensor = tf.tidy(() => {
      return examples.xs.slice([i, 0], [1, examples.xs.shape[1]]).reshape([28, 28, 1]);
    });

    const canvas = document.createElement('canvas');
    canvas.width = 28;
    canvas.height = 28;
    canvas.style = 'margin: 4px;';
    await tf.browser.toPixels(imageTensor, canvas);
    surface.drawArea.appendChild(canvas);

    imageTensor.dispose();
  }
}

function getModel(conv2dConfigs, maxPooling2dConfigs, denseConfigs, nodes, edges) {
  const model = tf.sequential();
  const IMAGE_WIDTH = 28;
  const IMAGE_HEIGHT = 28;
  const IMAGE_CHANNELS = 1;

  // 检查输入参数
  if (!nodes || nodes.length === 0) {
    console.error('No nodes found in the model structure');
    return model;
  }

  if (!edges || edges.length === 0) {
    console.error('No edges found in the model structure');
    return model;
  }

  // 输出详细节点和边信息用于调试
  console.log('Building model with nodes:', JSON.stringify(nodes));
  console.log('Building model with edges:', JSON.stringify(edges));

  // 构建邻接表
  const adjacencyList = {};
  nodes.forEach(node => {
    adjacencyList[node.id] = {
      node,
      next: [],
    };
  });

  // 填充邻接表的next数组
  edges.forEach(edge => {
    if (adjacencyList[edge.source]) {
      adjacencyList[edge.source].next.push(edge.target);
    }
  });

  // 找到没有入边的节点(源节点)
  const inDegree = {};
  nodes.forEach(node => {
    inDegree[node.id] = 0;
  });

  edges.forEach(edge => {
    inDegree[edge.target]++;
  });

  const sources = nodes
    .filter(node => inDegree[node.id] === 0)
    .map(node => node.id);

  console.log('Found sources:', sources);

  // 如果没有源节点，使用第一个节点作为起点
  const startNode = sources.length > 0 ? sources[0] : nodes[0].id;
  console.log('Starting from node:', startNode);

  // 使用BFS遍历图获取有序模型结构
  const visited = new Set();
  const queue = [startNode];
  let hasAddedFlatten = false;
  let layerCount = 0;

  while (queue.length > 0) {
    const currentId = queue.shift();

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const current = adjacencyList[currentId];
    if (!current) {
      console.warn(`Node ${currentId} not found in adjacency list`);
      continue;
    }

    const { node } = current;
    console.log(`Processing node:`, node);

    // 只添加实际的层节点，跳过数据源节点
    if (node.type !== 'mnist' && node.type !== 'useData') {
      switch (node.type) {
        case 'conv2d':
          if (layerCount === 0) {
            // 第一个Conv2D层需要指定inputShape
            console.log('Adding first Conv2D layer with inputShape');
            model.add(tf.layers.conv2d({
              inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS],
              ...conv2dConfigs[node.configIndex]
            }));
          } else {
            console.log('Adding Conv2D layer');
            model.add(tf.layers.conv2d(conv2dConfigs[node.configIndex]));
          }
          layerCount++;
          break;
        case 'maxPooling2d':
          console.log('Adding MaxPooling2D layer');
          model.add(tf.layers.maxPooling2d(maxPooling2dConfigs[node.configIndex]));
          layerCount++;
          break;
        case 'dense':
          // 在添加Dense层之前，检查上一层的类型
          // 如果前一层是GRU或LSTM，它们已经输出2D张量，不需要添加Flatten
          const prevLayerType = model.layers.length > 0 ? model.layers[model.layers.length - 1].constructor.name.toLowerCase() : '';
          const needFlatten = !hasAddedFlatten && 
                              !prevLayerType.includes('gru') && 
                              !prevLayerType.includes('lstm') &&
                              !prevLayerType.includes('dense') && 
                              !prevLayerType.includes('dropout') &&
                              !prevLayerType.includes('activation');
          
          if (needFlatten) {
            console.log('Adding Flatten layer before Dense layer');
            model.add(tf.layers.flatten());
            hasAddedFlatten = true;
            layerCount++;
          } else if (prevLayerType) {
            console.log(`Connecting Dense directly to ${prevLayerType} (Flatten not needed)`);
          }
          
          console.log('Adding Dense layer');
          model.add(tf.layers.dense(denseConfigs[node.configIndex] || denseConfigs[0]));
          layerCount++;
          break;
        case 'dropout':
          console.log('Adding Dropout layer');
          model.add(tf.layers.dropout(useStore.getState().dropoutConfigs[node.configIndex]));
          layerCount++;
          break;
        case 'batchNorm':
          console.log('Adding BatchNormalization layer');
          model.add(tf.layers.batchNormalization(useStore.getState().batchNormConfigs[node.configIndex]));
          layerCount++;
          break;
        case 'flatten':
          console.log('Adding Flatten layer');
          model.add(tf.layers.flatten());
          hasAddedFlatten = true;
          layerCount++;
          break;
        case 'lstm':
          if (layerCount === 0) {
            // 第一个LSTM层需要指定inputShape
            console.log('Adding first LSTM layer with inputShape');
            model.add(tf.layers.lstm({
              inputShape: [null, 28], // 假设输入是序列数据，需要根据实际情况调整
              ...useStore.getState().lstmConfigs[node.configIndex]
            }));
          } else {
            console.log('Adding LSTM layer');
            model.add(tf.layers.lstm(useStore.getState().lstmConfigs[node.configIndex]));
          }
          layerCount++;
          break;
        case 'gru':
          if (layerCount === 0) {
            // 第一个GRU层需要指定inputShape，根据数据源动态调整
            console.log('Adding first GRU layer with inputShape');
            
            // 获取CSV数据信息，如果有的话
            const csvData = useStore.getState().csvData;
            let featuresDim = 28; // 默认值，适用于MNIST数据
            
            // 如果CSV数据存在，尝试自动检测特征维度
            if (csvData && csvData.length > 0) {
              const numericColumns = [];
              // 识别所有数值列
              if (csvData[0]) {
                Object.keys(csvData[0]).forEach(key => {
                  if (key !== 'label' && key !== 'date' && 
                      (typeof csvData[0][key] === 'number' || !isNaN(parseFloat(csvData[0][key])))) {
                    numericColumns.push(key);
                  }
                });
              }
              
              if (numericColumns.length > 0) {
                featuresDim = numericColumns.length;
              }
            }
            
            console.log(`Detected features dimension for GRU: ${featuresDim}`);
            
            model.add(tf.layers.gru({
              inputShape: [null, featuresDim], // 动态设置特征维度
              ...useStore.getState().gruConfigs[node.configIndex]
            }));
          } else {
            console.log('Adding GRU layer');
            model.add(tf.layers.gru(useStore.getState().gruConfigs[node.configIndex]));
          }
          layerCount++;
          break;
        case 'activation':
          console.log('Adding Activation layer');
          model.add(tf.layers.activation(useStore.getState().activationConfigs[node.configIndex]));
          layerCount++;
          break;
        case 'reshape':
          console.log('Adding Reshape layer');
          model.add(tf.layers.reshape(useStore.getState().reshapeConfigs[node.configIndex]));
          layerCount++;
          break;
        case 'avgPooling2d':
          console.log('Adding AvgPooling2D layer');
          model.add(tf.layers.averagePooling2d(useStore.getState().avgPooling2dConfigs[node.configIndex]));
          layerCount++;
          break;
        default:
          console.warn(`Unknown node type: ${node.type}`);
      }
    }

    // 将所有未访问的邻居加入队列
    current.next.forEach(nextId => {
      if (!visited.has(nextId)) {
        queue.push(nextId);
      }
    });
  }

  console.log(`Total layers added: ${layerCount}`);

  if (layerCount === 0) {
    console.error('No layers were added to the model');
    return model;
  }

  // 编译模型
  try {
    console.log('Compiling model...');
    const optimizer = tf.train.adam();
    model.compile({
      optimizer: optimizer,
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });
    console.log('Model compiled successfully');
  } catch (error) {
    console.error('Error compiling model:', error);
    console.error('Model structure:', model.summary());
    alert(`模型编译失败: ${error.message}\n请检查模型结构`);
  }

  return model;
}

async function train(model, data, isCsv) {
  try {
    // 验证模型是否已编译
    if (!model.compiled) {
      console.error('Model is not compiled. Attempting to compile...');
      try {
        model.compile({
          optimizer: 'adam',
          loss: 'categoricalCrossentropy',
          metrics: ['accuracy'],
        });
        console.log('Model compiled successfully in train function');
      } catch (compileError) {
        console.error('Failed to compile model in train function:', compileError);
        throw new Error(`模型编译失败: ${compileError.message}`);
      }
    }

    const metrics = ['loss', 'val_loss', 'acc', 'val_acc'];
    const container = { name: 'Model Training', tab: 'Model', styles: { height: '1000px' } };
    const fitCallbacks = tfvis.show.fitCallbacks(container, metrics);

    let trainXs, trainYs, testXs, testYs;

    if (isCsv) {
      // 处理CSV数据，检测数值列
      console.log('Processing CSV data for training');
      const numericColumns = [];
      
      // 识别所有数值列
      if (data.length > 0 && data[0]) {
        Object.keys(data[0]).forEach(key => {
          if (key !== 'label' && key !== 'date' && 
              (typeof data[0][key] === 'number' || !isNaN(parseFloat(data[0][key])))) {
            numericColumns.push(key);
          }
        });
      }
      
      console.log('Detected numeric columns:', numericColumns);
      
      if (numericColumns.length === 0) {
        console.error('No numeric columns found in CSV data');
        return;
      }
      
      // 提取特征和标签
      const features = data.map(row => {
        return numericColumns.map(col => {
          const value = typeof row[col] === 'number' ? row[col] : parseFloat(row[col]);
          return isNaN(value) ? 0 : value;
        });
      });
      
      console.log(`Extracted ${features.length} samples, each with ${features[0].length} features`);
      
      // 检查数据是否足够进行训练
      if (features.length < 10) {
        console.error('Not enough data samples for training (minimum 10 required)');
        return;
      }
      
      const labelField = 'label';
      const labels = data.map(row => Number(row[labelField] || 0));
      const uniqueLabels = [...new Set(labels)];
      const numClasses = Math.max(uniqueLabels.length, 3); // 至少有3个类别
      
      // 数据标准化 - 对每个特征进行归一化处理
      const featureMeans = [];
      const featureStds = [];
      
      // 计算每个特征的均值
      for (let i = 0; i < features[0].length; i++) {
        let sum = 0;
        for (let j = 0; j < features.length; j++) {
          sum += features[j][i];
        }
        featureMeans.push(sum / features.length);
      }
      
      // 计算每个特征的标准差
      for (let i = 0; i < features[0].length; i++) {
        let sumSquaredDiff = 0;
        for (let j = 0; j < features.length; j++) {
          sumSquaredDiff += Math.pow(features[j][i] - featureMeans[i], 2);
        }
        featureStds.push(Math.sqrt(sumSquaredDiff / features.length) || 1);
      }
      
      // 标准化特征
      const normalizedFeatures = features.map(sample => {
        return sample.map((value, index) => {
          return (value - featureMeans[index]) / featureStds[index];
        });
      });
      
      console.log('Feature statistics:');
      console.log('- Means:', featureMeans);
      console.log('- Standard deviations:', featureStds);
      
      console.log(`Found ${numClasses} unique classes in label column`);
      
      // 创建正确的3D数组结构 [samples, timesteps, features]
      const reshapedFeatures = [];
      for (let i = 0; i < normalizedFeatures.length; i++) {
        const sample = [];
        sample.push(normalizedFeatures[i]); // 一个样本只有一个时间步
        reshapedFeatures.push(sample);
      }
      
      console.log('Final tensor shape:', 
        `[${reshapedFeatures.length}, ${reshapedFeatures[0].length}, ${reshapedFeatures[0][0].length}]`);
      
      // 创建张量
      const xs = tf.tensor3d(reshapedFeatures);
      const ys = tf.oneHot(labels, numClasses);
      
      console.log('Created tensors -', 
        'Features:', xs.shape, 
        'Labels:', ys.shape);
      
      // 分割训练集和测试集
      const splitIndex = Math.floor(xs.shape[0] * 0.8);
      [trainXs, testXs] = tf.split(xs, [splitIndex, xs.shape[0] - splitIndex]);
      [trainYs, testYs] = tf.split(ys, [splitIndex, ys.shape[0] - splitIndex]);
      
      xs.dispose();
      ys.dispose();
    } else {
      const BATCH_SIZE = 512;
      const TRAIN_DATA_SIZE = 5500;
      const TEST_DATA_SIZE = 1000;

      [trainXs, trainYs] = tf.tidy(() => {
        const d = data.nextTrainBatch(TRAIN_DATA_SIZE);
        return [
          d.xs.reshape([TRAIN_DATA_SIZE, 28, 28, 1]),
          d.labels
        ];
      });

      [testXs, testYs] = tf.tidy(() => {
        const d = data.nextTestBatch(TEST_DATA_SIZE);
        return [
          d.xs.reshape([TEST_DATA_SIZE, 28, 28, 1]),
          d.labels
        ];
      });
    }

    // 训练模型
    console.log(`Starting training with:
      - Training data shape: ${trainXs.shape} 
      - Training labels shape: ${trainYs.shape}
      - Testing data shape: ${testXs.shape}
      - Testing labels shape: ${testYs.shape}
    `);
    
    // 调试: 检查模型的预期输入形状
    if (model.inputs.length > 0) {
      console.log('Model expected input shape:', model.inputs[0].shape);
    }
    
    return await model.fit(trainXs, trainYs, {
      batchSize: 512,
      validationData: [testXs, testYs],
      epochs: 10,
      shuffle: true,
      callbacks: fitCallbacks
    });
  } catch (error) {
    console.error('Error in train function:', error);
    // 使用console.error代替tfvis.show.text，因为后者可能会不存在
    console.error(`训练错误: ${error.message}\n请检查console获取更多详情。`);
    throw error;
  }
}

function TrainButton() {
  const { 
    conv2dConfigs, 
    maxPooling2dConfigs, 
    denseConfigs, 
    csvData, 
    isData, 
    nodes, 
    edges
  } = useStore();

  const handleTrainClick = useCallback(async () => {
    try {
      console.log('Train button clicked');
      console.log('Current store state - nodes:', nodes);
      console.log('Current store state - edges:', edges);
      
      let data;
      let isCsv = false;

      if (isData) {
        data = csvData;
        isCsv = true;
      } else {
        data = new MnistData();
        await data.load();
        await showExamples(data);
      }

      const model = getModel(conv2dConfigs, maxPooling2dConfigs, denseConfigs, nodes, edges);
      
      // 检查模型是否有效
      if (!model || !model.layers || model.layers.length === 0) {
        console.error('Invalid model created. Model has no layers.');
        alert('创建模型失败。请确保模型结构正确。');
        return;
      }
      
      tfvis.show.modelSummary({ name: 'Model Architecture', tab: 'Model' }, model);

      await train(model, data, isCsv);
    } catch (error) {
      console.error('Error in handleTrainClick:', error);
      alert(`训练过程中发生错误: ${error.message}`);
    }
  }, [conv2dConfigs, maxPooling2dConfigs, denseConfigs, csvData, isData, nodes, edges]);

  return (
    <button 
      onClick={handleTrainClick} 
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
    >
      Train Model
    </button>
  );
}

export default TrainButton;



