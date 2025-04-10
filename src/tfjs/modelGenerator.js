/**
 * 模型生成器 - 将可视化模型结构转换为TensorFlow.js代码
 */

// 生成模型代码
export const generateModelCode = (modelStructure, edges) => {
    console.log('generateModelCode 接收到的模型结构:', modelStructure);
    
    if (!modelStructure || !Array.isArray(modelStructure) || modelStructure.length === 0) {
      return '// Please add model components before generating code';
    }
  
    // 定义有效的模型层类型（不包括数据源节点）
    const validLayerTypes = [
      'conv2d', 
      'maxPooling2d', 
      'avgPooling2d', 
      'dense', 
      'dropout', 
      'batchNorm', 
      'flatten', 
      'lstm', 
      'gru', 
      'activation', 
      'reshape'
    ];
    
    // 检查数据源节点类型 - 从原始 modelStructure 中检查，而不是只在有效层中检查
    const hasMnistDataset = modelStructure.some(node => node.type === 'mnist');
    const hasCsvDataset = modelStructure.some(node => node.type === 'useData');
    
    console.log('数据源检测: MNIST =', hasMnistDataset, 'CSV =', hasCsvDataset);
    
    // 过滤出有效的模型层（不包括数据源节点）
    const validModelStructure = modelStructure.filter(node => validLayerTypes.includes(node.type));
    
    console.log('有效模型层:', validModelStructure.map(node => node.type).join(', '));
    
    if (validModelStructure.length === 0) {
      return '// Please add valid model components before generating code';
    }
  
    let code = `
  // TensorFlow.js Model Definition
  const createModel = () => {
    console.log('Creating model with structure:', ${JSON.stringify(validModelStructure)});
    
    const model = tf.sequential();
    
    // 设置输入特征数量 - 根据您的数据调整这个值
    const inputFeatures = 4; // 降水量、最高温度、最低温度、风速
    
  `;
  
    // 根据sequenceId排序的层
    const sortedLayers = [...validModelStructure].sort((a, b) => {
      // 如果 sequenceId 不存在或相等，使用 configIndex 作为备选
      const aSeq = a.config.sequenceId !== undefined ? a.config.sequenceId : (a.config.index || 0);
      const bSeq = b.config.sequenceId !== undefined ? b.config.sequenceId : (b.config.index || 0);
      return aSeq - bSeq;
    });
    
    // 添加调试信息
    code += `    // Model structure (sorted by sequenceId): ${JSON.stringify(sortedLayers)}\n`;
    
    // 添加层
    sortedLayers.forEach((layer, index) => {
      // 添加更多调试信息
      code += `    // Processing layer ${index}: ${layer.type}\n`;
      if (index === 0) {
        code += `    // This is the first layer and requires inputShape\n`;
      }
      
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
          code += generateReshapeCode(layer.config, index === 0);
          break;
        default:
          throw new Error(`Unknown layer type: ${layer.type}`);
      }
    });
  
    // 添加编译和训练方法
    code += `
    // Compile model
    model.compile({
      optimizer: ${generateOptimizerCode(validModelStructure.find(layer => layer.type === 'optimizer')?.config) || "'adam'"},
      loss: ${generateLossCode(validModelStructure.find(layer => layer.type === 'loss')?.config) || "'categoricalCrossentropy'"},
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
      ` : hasCsvDataset ? `
      // CSV Data Processing Functions
      
      // 将CSV数据转换为张量
      const createTensorsFromCsvData = (data, timeSteps = 7, predictSteps = 1) => {
        // 数据已经在UseData组件中预处理过，是一个数组，每行包含所有数值列的值
        
        console.log('Processing CSV data with length:', data.length);
        
        if (!data || data.length === 0) {
          console.error('Empty CSV data');
          return { xs: null, labels: null };
        }
        
        // 获取数据中的所有数值列
        const numericColumns = Object.keys(data[0]).filter(key => 
          typeof data[0][key] === 'number' || !isNaN(parseFloat(data[0][key]))
        );
        
        console.log('Detected numeric columns:', numericColumns);
        
        if (numericColumns.length === 0) {
          console.error('No numeric columns found in CSV data');
          return { xs: null, labels: null };
        }
        
        // 提取数值特征
        const features = data.map(row => {
          return numericColumns.map(col => {
            const value = typeof row[col] === 'number' ? row[col] : parseFloat(row[col]);
            return isNaN(value) ? 0 : value;
          });
        });
        
        console.log('Extracted features with shape:', features.length, 'x', features[0]?.length || 0);
        
        // 数据归一化
        const { normalizedFeatures, mins, maxs } = normalizeData(features);
        
        // 确定要预测的列（默认使用第一个数值列）
        const targetColumnIndex = 0;
        
        // 创建3D张量数据 (必须至少是3维才能与Flatten层兼容)
        // 形状: [样本数, 1或timeSteps, 特征数]
        let xs, ys;
        
        if (timeSteps > 1 && normalizedFeatures.length > timeSteps) {
          // 时间序列方法 - 使用滑动窗口
          const sequences = [];
          const targets = [];
          
          for (let i = 0; i <= normalizedFeatures.length - timeSteps - predictSteps; i++) {
            const sequence = normalizedFeatures.slice(i, i + timeSteps);
            sequences.push(sequence);
            
            // 默认预测下一个时间步的第一个特征
            const target = normalizedFeatures[i + timeSteps + predictSteps - 1][targetColumnIndex];
            targets.push([target]);
          }
          
          xs = tf.tensor3d(sequences);
          ys = tf.tensor2d(targets);
          
          console.log('Created time series data with shape:', 
            'xs:', xs.shape, 'ys:', ys.shape);
        } else {
          // 非时间序列方法 - 每个样本独立处理，但仍创建3D张量
          // 第二维设为1，保证与Flatten层兼容
          
          // 创建标签 (可以使用任何数值列作为标签，这里使用第一列)
          // 对于分类问题，通常需要将标签转为one-hot编码
          const featureCount = normalizedFeatures[0].length;
          
          // 使用所有特征作为输入
          const reshapedFeatures = normalizedFeatures.map(row => [row]); // 添加时间步维度 [batch, timesteps=1, features]
          
          xs = tf.tensor3d(reshapedFeatures);
          
          // 根据是分类还是回归问题，创建不同的标签
          // 这里假设是回归问题，直接使用第一个特征作为目标
          const targetValues = normalizedFeatures.map(row => [row[targetColumnIndex]]);
          ys = tf.tensor2d(targetValues);
          
          console.log('Created standard data with shape:', 
            'xs:', xs.shape, 'ys:', ys.shape);
        }
        
        return {
          xs,
          labels: ys,
          mins,
          maxs,
          numericColumns
        };
      };
      
      // 数据归一化函数
      const normalizeData = (data) => {
        if (!data || !data[0]) {
          return { normalizedFeatures: [], mins: [], maxs: [] };
        }
        
        // 找到每个特征的最小值和最大值
        const featureCount = data[0].length;
        const mins = Array(featureCount).fill(Number.MAX_SAFE_INTEGER);
        const maxs = Array(featureCount).fill(Number.MIN_SAFE_INTEGER);
        
        // 首先找最大最小值
        for (const row of data) {
          for (let i = 0; i < featureCount; i++) {
            if (row[i] < mins[i]) mins[i] = row[i];
            if (row[i] > maxs[i]) maxs[i] = row[i];
          }
        }
        
        // 防止除以零
        for (let i = 0; i < featureCount; i++) {
          if (mins[i] === maxs[i]) {
            maxs[i] = mins[i] + 1;
          }
        }
        
        // 归一化数据
        const normalizedFeatures = data.map(row => {
          return row.map((val, i) => {
            return (val - mins[i]) / (maxs[i] - mins[i]);
          });
        });
        
        return { normalizedFeatures, mins, maxs };
      };
      
      // 加载CSV数据
      // 使用 store 中的实际数据而不是示例数据
      const loadCsvData = async () => {
        // 从 store 获取数据
        const csvData = useStore.getState().csvData;
        
        if (!csvData || csvData.length === 0) {
          console.error('No CSV data found in store. Make sure to upload and process data first.');
          throw new Error('No CSV data available');
        }
        
        console.log('Loaded CSV data from store with length:', csvData.length);
        return csvData;
      };
      
      // 执行数据加载和训练
      try {
        // 加载CSV数据
        const csvData = await loadCsvData();
        
        // 创建张量数据
        // 对于非时间序列数据，使用 timeSteps=1 确保形状正确
        const trainData = createTensorsFromCsvData(csvData, 1);
        
        if (!trainData.xs) {
          throw new Error('Failed to create tensor data from CSV');
        }
        
        console.log('Input tensor shape:', trainData.xs.shape);
        console.log('Target tensor shape:', trainData.labels.shape);
        
        // 训练模型
        const history = await trainModel(model, trainData);
        
        console.log('Training complete with history:', history);
      } catch (error) {
        console.error('Error processing CSV data:', error);
      }
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
      
      // 使用更通用的输入形状设置，更适用于 CSV 数据
      // 假设输入是 [样本数, 时间步数, 特征维度]
      // 这里我们设置为 [null, 特征维度]，允许任意长度的序列
      code += `    inputShape: [null, inputFeatures],\n`; // 使用动态特征数量
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
      
      // 使用更通用的输入形状设置，更适用于 CSV 数据
      code += `    inputShape: [null, inputFeatures],\n`; // 使用动态特征数量
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
  const generateReshapeCode = (config, isFirstLayer) => {
    const { targetShape = '(None, 7, 4)', inputFeatures = 4 } = config || {};
    
    console.log('Reshape config:', config);
    console.log('Target shape (original):', targetShape, typeof targetShape);
    
    // 解析目标形状字符串，例如 "(None, 7, 4)" 或 "(28, 28, 1)"
    let parsedShape;
    if (typeof targetShape === 'string') {
      // 移除括号并分割字符串
      parsedShape = targetShape.replace(/[()]/g, '').split(',').map(item => {
        item = item.trim();
        // 处理 "None" 值，在 TensorFlow.js 中使用 null 表示
        return item === 'None' || item === 'null' ? 'null' : parseInt(item, 10);
      });
      
      console.log('Parsed shape after string processing:', parsedShape);
    } else if (Array.isArray(targetShape)) {
      parsedShape = targetShape;
      console.log('Target shape is already an array:', parsedShape);
    } else {
      // 默认形状
      parsedShape = [null, 7, 4];
      console.log('Using default shape:', parsedShape);
    }
    
    let code = `  // Add Reshape layer\n`;
    
    // 如果是第一层，需要添加 inputShape
    if (isFirstLayer) {
      code += `  console.log('Adding Reshape as first layer');\n`;
      code += `  // Reshape as first layer - ensure inputShape is at least 2D for Flatten compatibility\n`;
      code += `  model.add(tf.layers.reshape({\n`;
      
      // 确保输入形状正确
      // 对于CSV数据，我们确保输入是二维的，至少包含一个时间步维度
      code += `    // 为避免维度错误, 确保输入形状是合适的\n`;
      
      // 根据不同情况设置不同的输入形状
      code += `    // 检查数据源是CSV还是图像数据\n`;
      code += `    inputShape: Array.isArray(inputFeatures) ? inputFeatures : [inputFeatures],\n`;
      
      // 确保 targetShape 是适当的格式
      code += `    targetShape: [${parsedShape.join(', ')}],\n`;
      code += `    // 添加错误处理以防止维度不兼容\n`;
      code += `    // 如果需要从1D到更高维度，请确保原始数据大小兼容\n`;
    } else {
      // 不是第一层
      code += `  console.log('Adding Reshape layer (not first)');\n`;
      code += `  model.add(tf.layers.reshape({\n`;
      
      // 目标形状
      code += `    targetShape: [${parsedShape.join(', ')}],\n`;
    }
    
    code += `  }));\n\n`;
    
    // 添加调试代码来帮助解决维度问题
    code += `  // 打印 Reshape 后的输出形状以帮助调试\n`;
    code += `  try {\n`;
    code += `    const lastLayerOutput = model.layers[model.layers.length - 1].outputShape;\n`;
    code += `    console.log('Reshape output shape:', lastLayerOutput);\n`;
    code += `  } catch (e) {\n`;
    code += `    console.warn('Could not determine Reshape output shape:', e.message);\n`;
    code += `  }\n\n`;
    
    return code;
  };
  
  // 生成AvgPooling2D层代码
  const generateAvgPooling2DCode = (config) => {
    const { poolSize = '(2, 2)', strides = '(2, 2)', padding = 'valid' } = config || {};
    
    console.log('AvgPooling2D config:', config);
    
    // 解析poolSize和strides，支持字符串格式 "(2, 2)" 或数组格式 [2, 2]
    let parsedPoolSize = poolSize;
    let parsedStrides = strides;
    
    // 处理字符串格式的poolSize
    if (typeof poolSize === 'string') {
      parsedPoolSize = poolSize.replace(/[()]/g, '').split(',').map(item => parseInt(item.trim(), 10));
    }
    
    // 处理字符串格式的strides
    if (typeof strides === 'string') {
      parsedStrides = strides.replace(/[()]/g, '').split(',').map(item => parseInt(item.trim(), 10));
    }
    
    let code = `  // Add AveragePooling2D layer\n`;
    code += `  model.add(tf.layers.averagePooling2d({\n`;
    code += `    poolSize: [${parsedPoolSize[0] || 2}, ${parsedPoolSize[1] || 2}],\n`;
    code += `    strides: [${parsedStrides[0] || 2}, ${parsedStrides[1] || 2}],\n`;
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
  
    // 定义有效的模型层类型
    const validLayerTypes = [
      'conv2d',
      'maxPooling2d',
      'avgPooling2d',
      'dense',
      'dropout',
      'batchNorm',
      'flatten',
      'lstm',
      'gru',
      'activation',
      'reshape',
      'mnist',
      'useData'
    ];
    
    // 过滤出有效的模型层节点
    const validNodes = nodes.filter(node => validLayerTypes.includes(node.type));
    
    // 输出调试信息
    console.log('所有节点:', nodes.map(n => `${n.id}(${n.type})`).join(', '));
    console.log('有效节点:', validNodes.map(n => `${n.id}(${n.type})`).join(', '));
    
    // 如果没有有效的模型层节点，返回错误
    if (validNodes.length === 0) {
      return { valid: false, message: 'Model is empty, please add at least one valid component' };
    }

    // 检查是否有未连接的节点
    const connectedNodes = new Set();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });
    
    console.log('已连接节点:', Array.from(connectedNodes).join(', '));
    
    // 如果只有一个节点，不需要检查连接
    if (validNodes.length === 1) {
      return { valid: true };
    }
    
    // 检查是否所有非数据源节点都已连接
    // 只检查有效的模型层节点
    const unconnectedNodes = validNodes.filter(node => {
      // 数据源节点可以没有入边
      if (node.type === 'mnist' || node.type === 'useData') {
        return false;
      }
      // 其他节点必须有连接
      return !connectedNodes.has(node.id);
    });
    
    console.log('未连接的有效节点:', unconnectedNodes.map(n => `${n.id}(${n.type})`).join(', '));
    
    if (unconnectedNodes.length > 0) {
      return {
        valid: false,
        message: `Unconnected nodes found: ${unconnectedNodes.map(n => n.type).join(', ')}`
      };
    }

    // 检查是否已进行连接
    const hasConnection = edges.length > 0;
    if (!hasConnection) {
      return { valid: false, message: 'No connections between nodes, please connect your layers' };
    }

    return { valid: true };
  };
  
  // 从图结构生成模型层次结构
  export function generateModelStructureFromGraph(nodes, edges) {
    // 定义有效的模型层类型（不包括数据源和训练按钮）
    const validModelLayerTypes = [
        'conv2d',
        'maxPooling2d',
        'avgPooling2d',
        'dense',
        'dropout',
        'batchNorm',
        'flatten',
        'lstm',
        'gru',
        'activation',
        'reshape'
    ];
    
    // 数据源节点类型
    const dataSourceTypes = ['mnist', 'useData'];
    
    // 所有有效的节点类型
    const validNodeTypes = [...validModelLayerTypes, ...dataSourceTypes];

    // 过滤出有效的节点（模型层和数据源）
    const validNodes = nodes.filter(node => validNodeTypes.includes(node.type));
    
    console.log('生成模型结构 - 有效节点:', validNodes.map(n => `${n.id}(${n.type})`).join(', '));
    
    // 如果没有有效的节点，返回空数组
    if (validNodes.length === 0) {
        console.warn('没有找到有效的模型层节点');
        return [];
    }
    
    // 过滤出模型层节点（不包括数据源）
    const modelLayerNodes = validNodes.filter(node => validModelLayerTypes.includes(node.type));
    
    if (modelLayerNodes.length === 0) {
        console.warn('没有找到有效的模型层节点，只有数据源节点');
        return [];
    }

    // 创建邻接表来表示节点之间的连接关系
    const adjacencyList = {};
    validNodes.forEach(node => {
        adjacencyList[node.id] = [];
    });

    // 找出有效的边（连接有效节点的边）
    const validEdges = edges.filter(edge => 
        validNodes.some(n => n.id === edge.source) && 
        validNodes.some(n => n.id === edge.target)
    );
    
    console.log('有效边:', validEdges.map(e => `${e.source} -> ${e.target}`).join(', '));
    
    if (validEdges.length === 0) {
        console.warn('没有找到有效的连接边');
        return [];
    }

    // 填充邻接表
    validEdges.forEach(edge => {
        if (adjacencyList[edge.source]) {
            adjacencyList[edge.source].push(edge.target);
        }
    });
    
    console.log('邻接表:', adjacencyList);

    // 找到所有入度为0的节点（起始节点）
    const inDegree = {};
    validNodes.forEach(node => {
        inDegree[node.id] = 0;
    });
    
    validEdges.forEach(edge => {
        if (inDegree[edge.target] !== undefined) {
            inDegree[edge.target]++;
        }
    });
    
    console.log('节点入度:', Object.entries(inDegree).map(([id, degree]) => `${id}: ${degree}`).join(', '));

    // 找出所有入度为0的节点作为起始点
    let startNodes = validNodes
        .filter(node => inDegree[node.id] === 0)
        .map(node => node.id);
    
    // 如果没有入度为0的节点，但有数据源节点，则使用数据源节点作为起始点
    if (startNodes.length === 0) {
        const dataNodes = validNodes.filter(node => dataSourceTypes.includes(node.type));
        if (dataNodes.length > 0) {
            console.log('使用数据源节点作为起始点:', dataNodes.map(n => n.id).join(', '));
            startNodes = dataNodes.map(node => node.id);
        } else {
            console.warn('找不到有效的起始节点');
            return [];
        }
    }
    
    console.log('找到的起始节点:', startNodes.join(', '));

    // 使用BFS遍历图，保持节点的添加顺序
    const visited = new Set();
    const queue = [...startNodes];
    const modelStructure = [];
    const typeCounts = {};

    console.log('开始BFS遍历，起始队列:', queue);

    while (queue.length > 0) {
        const currentId = queue.shift();
        
        if (visited.has(currentId)) {
            console.log(`节点 ${currentId} 已访问过，跳过`);
            continue;
        }
        
        console.log(`处理节点: ${currentId}`);
        visited.add(currentId);

        const current = validNodes.find(n => n.id === currentId);
        if (!current) {
            console.log(`找不到节点 ${currentId}，跳过`);
            continue;
        }

        // 只添加模型层节点到最终模型结构中，跳过数据源节点
        if (validModelLayerTypes.includes(current.type)) {
            // 更新类型计数
            if (typeCounts[current.type] === undefined) {
                typeCounts[current.type] = 0;
            }
            typeCounts[current.type]++;
            
            // 创建新的配置对象
            const config = {
                ...current.data,
                index: current.data.index !== undefined ? current.data.index : (typeCounts[current.type] - 1),
                sequenceId: current.data.sequenceId
            };
            
            modelStructure.push({
                type: current.type,
                config
            });
            
            console.log(`添加节点 ${current.id}(${current.type}) 到模型结构`);
        } else {
            console.log(`跳过数据源节点 ${current.id}(${current.type})`);
        }

        // 将当前节点的所有未访问的邻居加入队列
        const neighbors = adjacencyList[currentId] || [];
        console.log(`节点 ${currentId} 的邻居:`, neighbors);
        
        neighbors.forEach(neighborId => {
            if (!visited.has(neighborId)) {
                queue.push(neighborId);
                console.log(`将邻居 ${neighborId} 加入队列`);
            } else {
                console.log(`邻居 ${neighborId} 已访问过，不加入队列`);
            }
        });
    }

    // 如果只有数据源节点被访问了，但没有模型层节点，返回空数组
    if (modelStructure.length === 0) {
        console.warn('没有有效的模型层节点被添加到结构中');
        return [];
    }

    console.log('最终模型结构:', modelStructure);
    return modelStructure;
  } 