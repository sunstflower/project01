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

function getModel(conv2dConfigs, maxPooling2dConfigs, denseConfig, nodes, edges) {
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

  console.log('Building model with nodes:', nodes);
  console.log('Building model with edges:', edges);

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
          // 在添加Dense层之前，确保添加了Flatten层
          if (!hasAddedFlatten) {
            console.log('Adding Flatten layer before Dense layer');
            model.add(tf.layers.flatten());
            hasAddedFlatten = true;
            layerCount++;
          }
          console.log('Adding Dense layer');
          model.add(tf.layers.dense(denseConfig));
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
            // 第一个GRU层需要指定inputShape
            console.log('Adding first GRU layer with inputShape');
            model.add(tf.layers.gru({
              inputShape: [null, 28], // 假设输入是序列数据，需要根据实际情况调整
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
  const optimizer = tf.train.adam();
  model.compile({
    optimizer: optimizer,
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

async function train(model, data, isCsv) {
  const metrics = ['loss', 'val_loss', 'acc', 'val_acc'];
  const container = { name: 'Model Training', tab: 'Model', styles: { height: '1000px' } };
  const fitCallbacks = tfvis.show.fitCallbacks(container, metrics);

  let trainXs, trainYs, testXs, testYs;

  if (isCsv) {
    // Assuming CSV has columns: pixel1, pixel2, ..., pixel784, label
    const pixels = data.map(row => Object.values(row).slice(0, -1).map(Number));
    const labels = data.map(row => Number(row.label));

    const xs = tf.tensor(pixels, [pixels.length, 28, 28, 1]);
    const ys = tf.oneHot(labels, 10);

    // Split into training and testing sets
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

  return model.fit(trainXs, trainYs, {
    batchSize: 512,
    validationData: [testXs, testYs],
    epochs: 10,
    shuffle: true,
    callbacks: fitCallbacks
  }).finally(() => {
    trainXs.dispose();
    trainYs.dispose();
    testXs.dispose();
    testYs.dispose();
  });
}

function TrainButton() {
  const { 
    conv2dConfigs, 
    maxPooling2dConfigs, 
    denseConfig, 
    csvData, 
    isData, 
    nodes, 
    edges
  } = useStore();

  const handleTrainClick = useCallback(async () => {
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

    const model = getModel(conv2dConfigs, maxPooling2dConfigs, denseConfig, nodes, edges);
    tfvis.show.modelSummary({ name: 'Model Architecture', tab: 'Model' }, model);

    await train(model, data, isCsv);
  }, [conv2dConfigs, maxPooling2dConfigs, denseConfig, csvData, isData, nodes, edges]);

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



