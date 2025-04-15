/**
 * 模型生成器 - 将可视化模型结构转换为TensorFlow.js代码
 */

// 导入层验证工具
import { getLayerDescription, calculateModelShapes } from '@/utils/layerValidation';

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

    // 计算完整模型的形状信息
    const shapeMap = calculateModelShapes(modelStructure, edges);
    console.log('形状映射:', shapeMap);
  
    let code = `
  // TensorFlow.js Model Definition
  const createModel = () => {
    console.log('Creating model with structure:', ${JSON.stringify(validModelStructure)});
    
    const model = tf.sequential();
    
    // 设置输入特征数量 - 根据数据源类型自动配置
    let inputFeatures = 4; // 默认值
    let inputShape = null; // 将由第一层设置
    
  `;

    // 根据数据源设置合适的输入形状
    if (hasMnistDataset) {
      code += `    // MNIST输入形状: [28, 28, 1]
    inputShape = [28, 28, 1];
    console.log('Using MNIST dataset with input shape:', inputShape);
    `;
    } else if (hasCsvDataset) {
      code += `    // CSV数据输入形状: 使用配置的特征数
    inputShape = [inputFeatures];
    console.log('Using CSV dataset with input shape:', inputShape);
    `;
    }
  
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
      
      // 获取节点ID
      const nodeId = layer.id || `${layer.type}-${index}`;
      
      // 获取形状信息
      const shapeInfo = shapeMap[nodeId];
      const inputShapeInfo = shapeInfo?.inputShape;
      const outputShapeInfo = shapeInfo?.outputShape;
      
      if (shapeInfo?.error) {
        code += `    // ⚠️ 警告: 此层存在形状问题: ${shapeInfo.error}\n`;
      }
      
      // 记录输入输出形状
      if (inputShapeInfo) {
        code += `    // 输入形状: ${inputShapeInfo.description}\n`;
      }
      if (outputShapeInfo) {
        code += `    // 预期输出形状: ${outputShapeInfo.description}\n`;
      }
      
      if (index === 0) {
        code += `    // This is the first layer and requires inputShape\n`;
      }
      
      switch (layer.type) {
        case 'conv2d':
          code += generateConv2DCode(layer.config, index === 0, inputShapeInfo);
          break;
        case 'maxPooling2d':
          code += generateMaxPooling2DCode(layer.config);
          break;
        case 'avgPooling2d':
          code += generateAvgPooling2DCode(layer.config);
          break;
        case 'dense':
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
          code += generateLSTMCode(layer.config, index === 0, inputShapeInfo);
          break;
        case 'gru':
          code += generateGRUCode(layer.config, index === 0, inputShapeInfo);
          break;
        case 'activation':
          code += generateActivationCode(layer.config);
          break;
        case 'reshape':
          code += generateReshapeCode(layer.config, index === 0, inputShapeInfo);
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
      if (!model) {
        throw new Error('模型为空');
      }
      
      if (!data || !data.xs || !data.labels) {
        throw new Error('训练数据为空或格式不正确');
      }
      
      // 检查输入数据形状与模型输入层是否兼容
      const modelInputShape = model.inputs[0].shape;
      const dataShape = data.xs.shape;
      
      console.log('Model input shape:', modelInputShape);
      console.log('Training data shape:', dataShape);
      
      // 检查维度是否匹配
      if (modelInputShape.length !== dataShape.length) {
        console.warn(\`输入维度不匹配: 模型期望 \${modelInputShape.length}D 输入, 但数据是 \${dataShape.length}D\`);
        
        // 尝试重塑数据以匹配模型输入
        let reshapedXs;
        try {
          // 计算新的形状数组
          const newShape = [...modelInputShape];
          // 替换所有为null或者-1的维度
          let totalElements = data.xs.size;
          let negativeOneIndex = -1;
          let knownElementsProduct = 1;
          
          for (let i = 0; i < newShape.length; i++) {
            if (newShape[i] === null || newShape[i] === -1) {
              if (negativeOneIndex === -1) {
                negativeOneIndex = i;
              } else {
                // 如果存在多个未知维度，使用1替代第一个之外的维度
                newShape[i] = 1;
              }
            } else {
              knownElementsProduct *= newShape[i];
            }
          }
          
          // 计算未知维度的大小
          if (negativeOneIndex !== -1) {
            newShape[negativeOneIndex] = totalElements / knownElementsProduct;
          }
          
          console.log('Attempting to reshape input data to:', newShape);
          reshapedXs = data.xs.reshape(newShape);
          console.log('Successfully reshaped data to match model input');
          
          // 使用重塑后的数据
          data = {
            xs: reshapedXs,
            labels: data.labels
          };
        } catch (reshapeError) {
          console.error('Error reshaping data:', reshapeError);
          alert(\`无法重塑训练数据以匹配模型输入形状。请检查数据和模型结构。
          模型输入形状: \${JSON.stringify(modelInputShape)}
          数据形状: \${JSON.stringify(dataShape)}
          错误: \${reshapeError.message}\`);
          throw reshapeError;
        }
      }
      
      // 设置可视化指标
      const metrics = ['loss', 'val_loss', 'acc', 'val_acc'];
      const container = {
        name: 'Model Training', tab: 'Model', styles: { height: '1000px' }
      };
      const fitCallbacks = tfvis.show.fitCallbacks(container, metrics);
      
      // 添加提前停止回调
      const earlyStopping = tf.callbacks.earlyStopping({
        monitor: 'val_loss',
        minDelta: 0.001,
        patience: 3,
        verbose: 1
      });
      
      // 添加进度反馈
      const onBatchEnd = (batch, logs) => {
        console.log('Batch:', batch, 'Loss:', logs.loss.toFixed(4));
      };
      
      const onEpochEnd = (epoch, logs) => {
        console.log('Epoch:', epoch, 
          'Loss:', logs.loss.toFixed(4), 
          'Acc:', logs.acc.toFixed(4),
          'Val Loss:', logs.val_loss?.toFixed(4) || 'N/A', 
          'Val Acc:', logs.val_acc?.toFixed(4) || 'N/A'
        );
      };
      
      // 开始训练
      console.log('Starting model training...');
      const history = await model.fit(data.xs, data.labels, {
        batchSize: 32,
        validationSplit: 0.1,
        epochs: 10,
        shuffle: true,
        callbacks: [
          fitCallbacks, 
          earlyStopping,
          { onBatchEnd, onEpochEnd }
        ]
      });
      
      console.log('Training completed successfully');
      return history;
    } catch (error) {
      console.error('Error during model training:', error);
      alert(\`训练过程中发生错误: \${error.message}\`);
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
  const generateConv2DCode = (config, isFirstLayer, inputShape) => {
    const { kernelSize = 5, filters = 8, strides = 1, activation = 'relu', kernelInitializer = 'varianceScaling' } = config || {};
    
    let code = `  // Add Conv2D layer\n`;
    if (isFirstLayer) {
      // 使用从形状计算中获取的实际输入形状
      let inputShapeStr = '[28, 28, 1]'; // 默认MNIST形状
      
      if (inputShape && inputShape.shape) {
        // 移除批量维度（如果存在）
        const actualShape = inputShape.dimensions === 4 ? inputShape.shape.slice(1) : inputShape.shape;
        inputShapeStr = JSON.stringify(actualShape);
      }
      
      code += `  model.add(tf.layers.conv2d({\n    inputShape: ${inputShapeStr},\n`;
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
  const generateLSTMCode = (config, isFirstLayer, inputShape) => {
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
      
      // 使用从形状计算中获取的实际输入形状
      let timeSteps = 'null';
      let features = 'inputFeatures';
      
      if (inputShape && inputShape.shape && inputShape.shape.length >= 3) {
        if (inputShape.shape[1] !== null) timeSteps = inputShape.shape[1];
        if (inputShape.shape[2] !== null) features = inputShape.shape[2];
      }
      
      code += `    inputShape: [${timeSteps}, ${features}],\n`;
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
  const generateGRUCode = (config, isFirstLayer, inputShape) => {
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
      
      // 使用从形状计算中获取的实际输入形状
      let timeSteps = 'null';
      let features = 'inputFeatures';
      
      if (inputShape && inputShape.shape && inputShape.shape.length >= 3) {
        if (inputShape.shape[1] !== null) timeSteps = inputShape.shape[1];
        if (inputShape.shape[2] !== null) features = inputShape.shape[2];
      }
      
      code += `    inputShape: [${timeSteps}, ${features}],\n`;
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
  const generateReshapeCode = (config, isFirstLayer, inputShape) => {
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
      
      // 使用从形状计算中获取的实际输入形状
      let inputShapeStr = '[inputFeatures]';
      
      if (inputShape && inputShape.shape) {
        inputShapeStr = JSON.stringify(inputShape.shape);
      }
      
      code += `    inputShape: ${inputShapeStr},\n`;
      
      // 确保 targetShape 是适当的格式
      code += `    targetShape: [${parsedShape.join(', ')}],\n`;
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
  
  /**
   * 验证模型结构的有效性
   * @param {Array} nodes 节点列表
   * @param {Array} edges 连接列表
   * @returns {Object} 验证结果，包含valid和message字段
   */
  export function validateModelStructure(nodes, edges) {
    // 检查是否有节点
    if (!nodes || nodes.length === 0) {
      return { valid: false, message: "模型为空，请添加至少一个层" };
    }
    
    // 检查是否有数据源节点
    const dataNodes = nodes.filter(node => node.type === 'mnist' || node.type === 'useData');
    if (dataNodes.length === 0) {
      return { valid: false, message: "缺少数据源节点，请添加MNIST或自定义数据源" };
    }
    
    // 检查是否有多个数据源节点
    if (dataNodes.length > 1) {
      return { valid: false, message: "模型中只能有一个数据源节点" };
    }
    
    // 检查是否有处理层
    const processingNodes = nodes.filter(node => 
      !['mnist', 'useData', 'trainButton'].includes(node.type)
    );
    if (processingNodes.length === 0) {
      return { valid: false, message: "模型缺少处理层，请添加至少一个处理层" };
    }
    
    // 检查最后一层是否是Dense层（输出层）
    const lastProcessingNode = findLastProcessingNode(nodes, edges);
    if (!lastProcessingNode) {
      return { valid: false, message: "无法确定模型的最后一层" };
    }
    
    if (lastProcessingNode.type !== 'dense') {
      return { 
        valid: false, 
        message: "模型的最后一层应该是Dense层作为输出层"
      };
    }
    
    // 验证所有层都连接到了模型中
    const connectedNodes = getConnectedNodes(dataNodes[0], nodes, edges);
    const disconnectedNodes = nodes.filter(node => 
      node.type !== 'trainButton' && 
      !connectedNodes.some(cn => cn.id === node.id)
    );
    
    if (disconnectedNodes.length > 0) {
      const nodeTypes = disconnectedNodes.map(n => n.type).join(', ');
      return { 
        valid: false, 
        message: `模型中有未连接的层: ${nodeTypes}` 
      };
    }
    
    // 验证是否有循环连接
    const hasCycle = detectCycle(nodes, edges);
    if (hasCycle) {
      return { valid: false, message: "模型中存在循环连接，请移除循环" };
    }
    
    // 验证输出层设置
    const outputNode = lastProcessingNode;
    if (outputNode && outputNode.type === 'dense') {
      const index = outputNode.data?.index || 0;
      
      // 从useStore获取配置而不是window对象
      const store = typeof window !== 'undefined' && window.useStore ? window.useStore.getState() : null;
      const denseConfigs = store ? store.denseConfigs : [];
      
      console.log('验证Dense层配置:', { index, configs: denseConfigs });
      
      const config = denseConfigs[index] || {};
      
      if (!config.units) {
        return { 
          valid: false, 
          message: "输出层(Dense)未设置神经元数量，请配置输出层"
        };
      }
    }
    
    return { valid: true, message: "模型结构有效" };
  }
  
  /**
   * 查找模型的最后一个处理层
   * @param {Array} nodes 节点列表
   * @param {Array} edges 连接列表
   * @returns {Object} 最后一个处理层节点
   */
  function findLastProcessingNode(nodes, edges) {
    // 找出所有没有出边的节点（不包括trainButton）
    const nodeIds = nodes.map(node => node.id);
    const nodesWithOutEdges = nodeIds.filter(id => {
      return !edges.some(edge => edge.source === id);
    });
    
    // 从这些节点中找出不是trainButton的处理层
    const lastNodes = nodes.filter(node => 
      nodesWithOutEdges.includes(node.id) && 
      node.type !== 'trainButton'
    );
    
    if (lastNodes.length === 0) {
      return null;
    }
    
    return lastNodes[0];
  }
  
  /**
   * 获取从源节点可达的所有节点
   * @param {Object} startNode 起始节点
   * @param {Array} nodes 所有节点
   * @param {Array} edges 所有连接
   * @returns {Array} 可达节点列表
   */
  function getConnectedNodes(startNode, nodes, edges) {
    const connected = [startNode];
    let changed = true;
    
    while (changed) {
      changed = false;
      
      for (const edge of edges) {
        const sourceConnected = connected.some(node => node.id === edge.source);
        const targetNode = nodes.find(node => node.id === edge.target);
        const targetConnected = connected.some(node => node.id === edge.target);
        
        if (sourceConnected && targetNode && !targetConnected) {
          connected.push(targetNode);
          changed = true;
        }
      }
    }
    
    return connected;
  }
  
  /**
   * 检测模型中是否存在循环
   * @param {Array} nodes 节点列表
   * @param {Array} edges 连接列表
   * @returns {Boolean} 是否存在循环
   */
  function detectCycle(nodes, edges) {
    // 创建邻接表
    const adjacencyList = {};
    nodes.forEach(node => {
      adjacencyList[node.id] = [];
    });
    
    edges.forEach(edge => {
      if (adjacencyList[edge.source]) {
        adjacencyList[edge.source].push(edge.target);
      }
    });
    
    // DFS检测循环
    const visited = {};
    const recStack = {};
    
    function isCyclicUtil(nodeId) {
      if (!visited[nodeId]) {
        visited[nodeId] = true;
        recStack[nodeId] = true;
        
        const neighbors = adjacencyList[nodeId] || [];
        for (const neighbor of neighbors) {
          if (!visited[neighbor] && isCyclicUtil(neighbor)) {
            return true;
          } else if (recStack[neighbor]) {
            return true;
          }
        }
      }
      
      recStack[nodeId] = false;
      return false;
    }
    
    for (const node of nodes) {
      if (isCyclicUtil(node.id)) {
        return true;
      }
    }
    
    return false;
  }
  
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

  /**
   * 生成层的详细信息用于显示悬浮提示
   * @param {Object} node 节点对象
   * @param {Object} configs 配置对象
   * @returns {Object} 层信息，包含名称、描述、参数和输入/输出形状
   */
  export function generateLayerTooltip(node, allConfigs) {
    if (!node) return null;
    
    const { type, data } = node;
    const index = data?.index || 0;
    
    // 获取层的配置
    let config = {};
    switch (type) {
      case 'conv2d':
        config = allConfigs.conv2dConfigs?.[index] || {};
        break;
      case 'maxPooling2d':
        config = allConfigs.maxPooling2dConfigs?.[index] || {};
        break;
      case 'dense':
        config = allConfigs.denseConfigs?.[index] || {};
        break;
      // 其他层类型...
      default:
        config = {};
    }
    
    // 构建层描述
    const description = getLayerDescription(type);
    
    // 构建参数列表
    const params = Object.entries(config)
      .filter(([key]) => !['index', 'sequenceId'].includes(key))
      .map(([key, value]) => {
        // 格式化参数名称
        const formattedKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
        const formattedName = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
        
        return {
          name: formattedName,
          value: Array.isArray(value) ? `[${value.join(', ')}]` : value
        };
      });
    
    // 构建输入/输出形状描述
    let inputShape = 'Unknown';
    let outputShape = 'Unknown';
    
    // 根据不同层类型描述形状
    switch (type) {
      case 'mnist':
        inputShape = 'None';
        outputShape = '[batch, 28, 28, 1]';
        break;
      case 'useData':
        inputShape = 'None';
        outputShape = '[batch, height, width, channels]';
        break;
      case 'conv2d':
        inputShape = '[batch, height, width, channels]';
        outputShape = '[batch, height, width, filters]';
        break;
      case 'maxPooling2d':
      case 'avgPooling2d':
        inputShape = '[batch, height, width, channels]';
        outputShape = '[batch, height/poolSize, width/poolSize, channels]';
        break;
      case 'flatten':
        inputShape = '[batch, height, width, channels]';
        outputShape = '[batch, features]';
        break;
      case 'dense':
        inputShape = '[batch, features]';
        outputShape = `[batch, ${config.units || '?'}]`;
        break;
      // 其他层类型...
    }
    
    return {
      name: `${description} (${type})`,
      description,
      params,
      inputShape,
      outputShape
    };
  } 