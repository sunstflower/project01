/**
 * 模型生成器 - 将可视化模型结构转换为TensorFlow.js代码
 */

// 生成模型代码
export const generateModelCode = (modelStructure, edges) => {
    if (!modelStructure || !Array.isArray(modelStructure) || modelStructure.length === 0) {
      return '// Please add model components before generating code';
    }
  
    // 检查是否有MNIST数据源
    const hasMnistDataset = modelStructure.some(node => node.type === 'mnist');
    
    // 检查是否有CSV数据源
    const hasCsvDataset = modelStructure.some(node => node.type === 'useData');
  
    let code = `
  // TensorFlow.js Model Definition
  const createModel = () => {
    const model = tf.sequential();
    
  `;
  
    // 根据sequenceId排序的层
    const sortedLayers = [...modelStructure].sort((a, b) => a.config.sequenceId - b.config.sequenceId);
  
    // 添加层
    sortedLayers.forEach((layer, index) => {
      switch (layer.type) {
        case 'conv2d':
          code += generateConv2DCode(layer.config, index === 0);
          break;
        case 'maxPooling2d':
          code += generateMaxPooling2DCode(layer.config);
          break;
        case 'avgPooling2d':
          code += generateAvgPooling2DCode(layer.config);
          break;
        case 'dense':
          // 检查是否需要添加Flatten层
          const prevLayer = sortedLayers[index - 1];
          if (prevLayer && (prevLayer.type === 'conv2d' || prevLayer.type === 'maxPooling2d' || prevLayer.type === 'avgPooling2d')) {
            code += `  // Add Flatten layer\n`;
            code += `  model.add(tf.layers.flatten());\n\n`;
          }
          code += generateDenseCode(layer.config);
          break;
        case 'dropout':
          code += generateDropoutCode(layer.config);
          break;
        case 'batchNorm':
          code += generateBatchNormCode(layer.config);
          break;
        case 'flatten':
          code += generateFlattenCode();
          break;
        case 'lstm':
          code += generateLSTMCode(layer.config, index === 0);
          break;
        case 'gru':
          code += generateGRUCode(layer.config, index === 0);
          break;
        case 'activation':
          code += generateActivationCode(layer.config);
          break;
        case 'reshape':
          code += generateReshapeCode(layer.config);
          break;
        default:
          throw new Error(`Unknown layer type: ${layer.type}`);
      }
    });
  
    // 添加编译和训练方法
    code += `
    // Compile model
    model.compile({
      optimizer: ${generateOptimizerCode(modelStructure.find(layer => layer.type === 'optimizer')?.config) || "'adam'"},
      loss: ${generateLossCode(modelStructure.find(layer => layer.type === 'loss')?.config) || "'categoricalCrossentropy'"},
      metrics: ['accuracy'],
    });
    
    return model;
  };
  
  `;
  
    // 如果使用MNIST数据集，添加MNIST数据加载方法
    if (hasMnistDataset) {
      code += `
  // MNIST Data Loading Utility
  class MnistData {
    constructor() {
      this.trainXs = null;
      this.trainYs = null;
      this.testXs = null;
      this.testYs = null;
    }
  
    async load() {
      try {
        // MNIST data loading from TensorFlow.js example
        const trainImagesUrl = 'https://storage.googleapis.com/tfjs-examples/mnist/train-images-idx3-ubyte';
        const trainLabelsUrl = 'https://storage.googleapis.com/tfjs-examples/mnist/train-labels-idx1-ubyte';
        const testImagesUrl = 'https://storage.googleapis.com/tfjs-examples/mnist/t10k-images-idx3-ubyte';
        const testLabelsUrl = 'https://storage.googleapis.com/tfjs-examples/mnist/t10k-labels-idx1-ubyte';
  
        const [trainXs, trainYs, testXs, testYs] = await Promise.all([
          tf.data.binaryFiles(trainImagesUrl, {
            arrayBufferView: 'Uint8Array',
            chunkSize: 60000 * 784 + 16,
          }).map(parseImages),
          tf.data.binaryFiles(trainLabelsUrl, {
            arrayBufferView: 'Uint8Array',
            chunkSize: 60000 + 8,
          }).map(parseLabels),
          tf.data.binaryFiles(testImagesUrl, {
            arrayBufferView: 'Uint8Array',
            chunkSize: 10000 * 784 + 16,
          }).map(parseImages),
          tf.data.binaryFiles(testLabelsUrl, {
            arrayBufferView: 'Uint8Array',
            chunkSize: 10000 + 8,
          }).map(parseLabels),
        ]);
  
        this.trainXs = trainXs;
        this.trainYs = trainYs;
        this.testXs = testXs;
        this.testYs = testYs;
        
        console.log('MNIST dataset loaded successfully');
      } catch (error) {
        console.error('Error loading MNIST dataset:', error);
        throw error;
      }
    }
  
    getTrainData() {
      if (!this.trainXs || !this.trainYs) {
        throw new Error('MNIST dataset not loaded. Call load() first.');
      }
      const xs = tf.tensor4d(this.trainXs, [this.trainXs.length / 784, 28, 28, 1]);
      const labels = tf.tensor2d(this.trainYs, [this.trainYs.length / 10, 10]);
      return { xs, labels };
    }
  
    getTestData() {
      if (!this.testXs || !this.testYs) {
        throw new Error('MNIST dataset not loaded. Call load() first.');
      }
      const xs = tf.tensor4d(this.testXs, [this.testXs.length / 784, 28, 28, 1]);
      const labels = tf.tensor2d(this.testYs, [this.testYs.length / 10, 10]);
      return { xs, labels };
    }
  }
  
  // Helper functions for parsing MNIST data
  function parseImages(buffer) {
    return tf.tidy(() => {
      const start = 16; // Skip the header
      const length = 784;
      const data = new Float32Array(buffer.byteLength - start);
      for (let i = 0; i < buffer.byteLength - start; i++) {
        data[i] = buffer[start + i] / 255;
      }
      return data;
    });
  }
  
  function parseLabels(buffer) {
    return tf.tidy(() => {
      const start = 8; // Skip the header
      const labels = new Uint8Array(buffer.slice(start));
      return tf.oneHot(labels, 10).dataSync();
    });
  }
  `;
    }
  
    // 添加训练模型函数
    code += `
  // Training function
  const trainModel = async (model, data) => {
    try {
      const metrics = ['loss', 'val_loss', 'acc', 'val_acc'];
      const container = {
        name: 'Model Training', tab: 'Model', styles: { height: '1000px' }
      };
      const fitCallbacks = tfvis.show.fitCallbacks(container, metrics);
      
      const history = await model.fit(data.xs, data.labels, {
        batchSize: 32,
        validationSplit: 0.1,
        epochs: 10,
        shuffle: true,
        callbacks: fitCallbacks
      });
  
      return history;
    } catch (error) {
      console.error('Error during model training:', error);
      throw error;
    }
  };
  
  // Prediction function
  const predict = (model, inputData) => {
    try {
      const prediction = model.predict(inputData);
      return prediction;
    } catch (error) {
      console.error('Error during prediction:', error);
      throw error;
    }
  };
  
  // Run training process
  const run = async () => {
    try {
      const model = createModel();
      tfvis.show.modelSummary({name: 'Model Architecture', tab: 'Model'}, model);
      
      ${hasMnistDataset ? `
      // Load MNIST dataset
      const data = new MnistData();
      await data.load();
      const trainData = data.getTrainData();
      
      // Train model
      const history = await trainModel(model, trainData);
      
      // Evaluate model
      const testData = data.getTestData();
      const evaluation = await model.evaluate(testData.xs, testData.labels);
      console.log('Model evaluation:', {
        loss: evaluation[0].dataSync()[0],
        accuracy: evaluation[1].dataSync()[0]
      });
      ` : `
      // TODO: Load your data here
      // const trainData = await loadData();
      // await trainModel(model, trainData);
      `}
      
      console.log('Training complete');
    } catch (error) {
      console.error('Error in training process:', error);
    }
  };
  
  // Initialize the application
  document.addEventListener('DOMContentLoaded', () => {
    if (tfvis) tfvis.visor();
    run();
  });
  `;
  
    return code;
  };
  
  // 生成Conv2D层代码
  const generateConv2DCode = (config, isFirstLayer) => {
    const { kernelSize = 5, filters = 8, strides = 1, activation = 'relu', kernelInitializer = 'varianceScaling' } = config || {};
    
    let code = `  // Add Conv2D layer\n`;
    if (isFirstLayer) {
      code += `  model.add(tf.layers.conv2d({\n    inputShape: [28, 28, 1],\n`;
    } else {
      code += `  model.add(tf.layers.conv2d({\n`;
    }
    
    code += `    kernelSize: ${kernelSize},\n`;
    code += `    filters: ${filters},\n`;
    code += `    strides: ${strides},\n`;
    code += `    padding: 'valid',\n`;
    code += `    activation: '${activation}',\n`;
    code += `    kernelInitializer: '${kernelInitializer}'\n`;
    code += `  }));\n\n`;
    
    return code;
  };
  
  // 生成MaxPooling2D层代码
  const generateMaxPooling2DCode = (config) => {
    const { poolSize = [2, 2], strides = [2, 2] } = config || {};
    
    let code = `  // Add MaxPooling2D layer\n`;
    code += `  model.add(tf.layers.maxPooling2d({\n`;
    code += `    poolSize: [${poolSize[0]}, ${poolSize[1]}],\n`;
    code += `    strides: [${strides[0]}, ${strides[1]}],\n`;
    code += `    padding: 'valid'\n`;
    code += `  }));\n\n`;
    
    return code;
  };
  
  // 生成Dense层代码
  const generateDenseCode = (config) => {
    const { units = 10, activation = 'softmax', kernelInitializer = 'varianceScaling' } = config || {};
    
    let code = `  // Add Dense layer\n`;
    code += `  model.add(tf.layers.dense({\n`;
    code += `    units: ${units},\n`;
    code += `    activation: '${activation}',\n`;
    code += `    kernelInitializer: '${kernelInitializer}'\n`;
    code += `  }));\n\n`;
    
    return code;
  };
  
  // 生成Dropout层代码
  const generateDropoutCode = (config) => {
    const { rate = 0.2 } = config || {};
    
    let code = `  // Add Dropout layer\n`;
    code += `  model.add(tf.layers.dropout({\n`;
    code += `    rate: ${rate}\n`;
    code += `  }));\n\n`;
    
    return code;
  };
  
  // 生成BatchNormalization层代码
  const generateBatchNormCode = (config) => {
    const { 
      axis = -1, 
      momentum = 0.99, 
      epsilon = 0.001, 
      center = true, 
      scale = true 
    } = config || {};
    
    let code = `  // Add BatchNormalization layer\n`;
    code += `  model.add(tf.layers.batchNormalization({\n`;
    code += `    axis: ${axis},\n`;
    code += `    momentum: ${momentum},\n`;
    code += `    epsilon: ${epsilon},\n`;
    code += `    center: ${center},\n`;
    code += `    scale: ${scale}\n`;
    code += `  }));\n\n`;
    
    return code;
  };
  
  // 生成Flatten层代码
  const generateFlattenCode = () => {
    let code = `  // Add Flatten layer\n`;
    code += `  model.add(tf.layers.flatten());\n\n`;
    
    return code;
  };
  
  // 生成LSTM层代码
  const generateLSTMCode = (config, isFirstLayer) => {
    const { 
      units = 128, 
      activation = 'tanh', 
      recurrentActivation = 'sigmoid',
      returnSequences = false,
      dropout = 0.0,
      recurrentDropout = 0.0
    } = config || {};
    
    let code = `  // Add LSTM layer\n`;
    if (isFirstLayer) {
      // 为第一层添加inputShape
      code += `  model.add(tf.layers.lstm({\n`;
      code += `    inputShape: [null, 28],\n`; // 假设输入是序列数据，需要根据实际情况调整
    } else {
      code += `  model.add(tf.layers.lstm({\n`;
    }
    
    code += `    units: ${units},\n`;
    code += `    activation: '${activation}',\n`;
    code += `    recurrentActivation: '${recurrentActivation}',\n`;
    code += `    returnSequences: ${returnSequences},\n`;
    
    if (dropout > 0) {
      code += `    dropout: ${dropout},\n`;
    }
    
    if (recurrentDropout > 0) {
      code += `    recurrentDropout: ${recurrentDropout},\n`;
    }
    
    code += `    useBias: true\n`;
    code += `  }));\n\n`;
    
    return code;
  };
  
  // 生成GRU层代码
  const generateGRUCode = (config, isFirstLayer) => {
    const { 
      units = 128, 
      activation = 'tanh', 
      recurrentActivation = 'sigmoid',
      returnSequences = false,
      dropout = 0.0,
      recurrentDropout = 0.0
    } = config || {};
    
    let code = `  // Add GRU layer\n`;
    if (isFirstLayer) {
      // 为第一层添加inputShape
      code += `  model.add(tf.layers.gru({\n`;
      code += `    inputShape: [null, 28],\n`; // 假设输入是序列数据，需要根据实际情况调整
    } else {
      code += `  model.add(tf.layers.gru({\n`;
    }
    
    code += `    units: ${units},\n`;
    code += `    activation: '${activation}',\n`;
    code += `    recurrentActivation: '${recurrentActivation}',\n`;
    code += `    returnSequences: ${returnSequences},\n`;
    
    if (dropout > 0) {
      code += `    dropout: ${dropout},\n`;
    }
    
    if (recurrentDropout > 0) {
      code += `    recurrentDropout: ${recurrentDropout},\n`;
    }
    
    code += `    useBias: true\n`;
    code += `  }));\n\n`;
    
    return code;
  };
  
  // 生成激活函数层代码
  const generateActivationCode = (config) => {
    const { activation = 'relu' } = config || {};
    
    let code = `  // Add Activation layer\n`;
    code += `  model.add(tf.layers.activation({\n`;
    code += `    activation: '${activation}'\n`;
    code += `  }));\n\n`;
    
    return code;
  };
  
  // 生成Reshape层代码
  const generateReshapeCode = (config) => {
    const { targetShape = [28, 28, 1] } = config || {};
    
    let code = `  // Add Reshape layer\n`;
    code += `  model.add(tf.layers.reshape({\n`;
    code += `    targetShape: [${targetShape.join(', ')}]\n`;
    code += `  }));\n\n`;
    
    return code;
  };
  
  // 生成AvgPooling2D层代码
  const generateAvgPooling2DCode = (config) => {
    const { poolSize = [2, 2], strides = [2, 2], padding = 'valid' } = config || {};
    
    let code = `  // Add AveragePooling2D layer\n`;
    code += `  model.add(tf.layers.averagePooling2d({\n`;
    code += `    poolSize: [${poolSize[0]}, ${poolSize[1]}],\n`;
    code += `    strides: [${strides[0]}, ${strides[1]}],\n`;
    code += `    padding: '${padding}'\n`;
    code += `  }));\n\n`;
    
    return code;
  };
  
  // 生成优化器代码
  const generateOptimizerCode = (config) => {
    if (!config) return "'adam'";
    
    const { type = 'adam', learningRate = 0.001, beta1 = 0.9, beta2 = 0.999, epsilon = 1e-7, decay = 0.0 } = config;
    
    switch (type) {
      case 'adam':
        return `tf.train.adam(${learningRate}, ${beta1}, ${beta2}, ${epsilon})`;
      case 'sgd':
        return `tf.train.sgd(${learningRate})`;
      case 'rmsprop':
        return `tf.train.rmsprop(${learningRate}, ${decay})`;
      case 'adagrad':
        return `tf.train.adagrad(${learningRate})`;
      case 'adadelta':
        return `tf.train.adadelta(${learningRate})`;
      default:
        return "'adam'";
    }
  };
  
  // 生成损失函数代码
  const generateLossCode = (config) => {
    if (!config) return "'categoricalCrossentropy'";
    
    const { type = 'categoricalCrossentropy' } = config;
    
    return `'${type}'`;
  };
  
  // 整体模型定义和图连接验证
  export const validateModelStructure = (nodes, edges) => {
    if (!nodes || nodes.length === 0) {
      return { valid: false, message: 'Model is empty, please add at least one component' };
    }
  
    // 检查是否有未连接的节点
    const connectedNodes = new Set();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });
    
    // 如果只有一个节点，不需要检查连接
    if (nodes.length === 1) {
      return { valid: true };
    }
    
    // 检查是否所有非第一个节点都已连接
    const unconnectedNodes = nodes.filter((node, index) => {
      // 第一个节点可以没有入边
      return index > 0 && !connectedNodes.has(node.id);
    });
    
    if (unconnectedNodes.length > 0) {
      return {
        valid: false,
        message: `Unconnected nodes found: ${unconnectedNodes.map(n => n.type).join(', ')}`
      };
    }
  
    // 验证层的顺序和连接
    const layerOrder = nodes.map(node => node.type);
    let hasConvLayer = false;
    let hasMaxPoolingAfterConv = false;
  
    // 构建邻接表
    const adjacencyList = {};
    nodes.forEach(node => {
      adjacencyList[node.id] = [];
    });
    
    edges.forEach(edge => {
      adjacencyList[edge.source].push(edge.target);
    });
  
    // 验证每个层的连接
    for (let i = 0; i < layerOrder.length; i++) {
      const node = nodes[i];
      const layerType = node.type;
      
      // 检查输入层
      if (!edges.some(e => e.target === node.id)) {
        if (layerType !== 'mnist' && layerType !== 'useData') {
          return {
            valid: false,
            message: `Invalid input layer type: ${layerType}`
          };
        }
      }
      
      // 检查卷积层和池化层的关系
      if (layerType === 'maxPooling2d') {
        const prevLayer = nodes.find(n => 
          edges.some(e => e.source === n.id && e.target === node.id)
        );
        
        if (!prevLayer || prevLayer.type !== 'conv2d') {
          return {
            valid: false,
            message: 'MaxPooling2D layer must come after a Conv2D layer'
          };
        }
      }
      
      // 检查Dense层的连接
      if (layerType === 'dense') {
        const prevLayer = nodes.find(n => 
          edges.some(e => e.source === n.id && e.target === node.id)
        );
        
        if (prevLayer && (prevLayer.type === 'conv2d' || prevLayer.type === 'maxPooling2d')) {
          // 这里不需要验证，因为我们在生成代码时会自动添加Flatten层
        }
      }
    }
    
    return { valid: true };
  };
  
  // 从图结构生成模型层次结构
  export const generateModelStructureFromGraph = (nodes, edges) => {
    // 如果没有节点，返回空数组
    if (!nodes || nodes.length === 0) {
      return [];
    }
    
    // 创建邻接表表示图
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
    
    // 如果没有源节点，使用第一个节点作为起点
    const startNode = sources.length > 0 ? sources[0] : nodes[0].id;
    
    // 使用BFS遍历图获取有序模型结构
    const modelStructure = [];
    const visited = new Set();
    const queue = [startNode];
    
    // 用于跟踪每种类型的节点数量
    const typeCounts = {
      conv2d: 0,
      maxPooling2d: 0,
      dense: 0
    };
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      
      const current = adjacencyList[currentId];
      if (!current) continue;
      
      const { node } = current;
      
      // 只添加实际的层节点，跳过数据源节点
      if (node.type !== 'mnist' && node.type !== 'useData') {
        // 更新类型计数
        typeCounts[node.type]++;
        
        // 创建新的配置对象，使用正确的索引和序列ID
        const config = {
          ...node.data,
          index: typeCounts[node.type] - 1, // 使用0-based索引
          sequenceId: node.data.sequenceId // 添加序列ID
        };
        
        modelStructure.push({
          type: node.type,
          config
        });
      }
      
      // 将所有未访问的邻居加入队列
      current.next.forEach(nextId => {
        if (!visited.has(nextId)) {
          queue.push(nextId);
        }
      });
    }
    
    // 根据sequenceId排序
    return modelStructure.sort((a, b) => a.config.sequenceId - b.config.sequenceId);
  }; 