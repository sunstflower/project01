import * as tf from '@tensorflow/tfjs';


const IMAGE_SIZE = 784;
const NUM_CLASSES = 10;
const NUM_DATASET_ELEMENTS = 65000;

const NUM_TRAIN_ELEMENTS = 55000;
const NUM_TEST_ELEMENTS = NUM_DATASET_ELEMENTS - NUM_TRAIN_ELEMENTS;

const MNIST_IMAGES_SPRITE_PATH =
    'https://storage.googleapis.com/learnjs-data/model-builder/mnist_images.png';
const MNIST_LABELS_PATH =
    'https://storage.googleapis.com/learnjs-data/model-builder/mnist_labels_uint8';

/**
 * A class that fetches the sprited MNIST dataset and returns shuffled batches.
 *
 * NOTE: This will get much easier. For now, we do data fetching and
 * manipulation manually.
 */
export class MnistData {
  constructor() {
    this.shuffledTrainIndex = 0;
    this.shuffledTestIndex = 0;
  }

  async load() {
    // Make a request for the MNIST sprited image.
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgRequest = new Promise((resolve, reject) => {
      img.crossOrigin = '';
      img.onload = () => {
        img.width = img.naturalWidth;
        img.height = img.naturalHeight;

        const datasetBytesBuffer =
            new ArrayBuffer(NUM_DATASET_ELEMENTS * IMAGE_SIZE * 4);

        const chunkSize = 5000;
        canvas.width = img.width;
        canvas.height = chunkSize;

        for (let i = 0; i < NUM_DATASET_ELEMENTS / chunkSize; i++) {
          const datasetBytesView = new Float32Array(
              datasetBytesBuffer, i * IMAGE_SIZE * chunkSize * 4,
              IMAGE_SIZE * chunkSize);
          ctx.drawImage(
              img, 0, i * chunkSize, img.width, chunkSize, 0, 0, img.width,
              chunkSize);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          for (let j = 0; j < imageData.data.length / 4; j++) {
            // All channels hold an equal value since the image is grayscale, so
            // just read the red channel.
            datasetBytesView[j] = imageData.data[j * 4] / 255;
          }
        }
        this.datasetImages = new Float32Array(datasetBytesBuffer);

        resolve();
      };
      img.src = MNIST_IMAGES_SPRITE_PATH;
    });

    const labelsRequest = fetch(MNIST_LABELS_PATH);
    const [imgResponse, labelsResponse] =
        await Promise.all([imgRequest, labelsRequest]);

    this.datasetLabels = new Uint8Array(await labelsResponse.arrayBuffer());

    // Create shuffled indices into the train/test set for when we select a
    // random dataset element for training / validation.
    this.trainIndices = tf.util.createShuffledIndices(NUM_TRAIN_ELEMENTS);
    this.testIndices = tf.util.createShuffledIndices(NUM_TEST_ELEMENTS);

    // Slice the the images and labels into train and test sets.
    this.trainImages =
        this.datasetImages.slice(0, IMAGE_SIZE * NUM_TRAIN_ELEMENTS);
    this.testImages = this.datasetImages.slice(IMAGE_SIZE * NUM_TRAIN_ELEMENTS);
    this.trainLabels =
        this.datasetLabels.slice(0, NUM_CLASSES * NUM_TRAIN_ELEMENTS);
    this.testLabels =
        this.datasetLabels.slice(NUM_CLASSES * NUM_TRAIN_ELEMENTS);
  }

  nextTrainBatch(batchSize) {
    return this.nextBatch(
        batchSize, [this.trainImages, this.trainLabels], () => {
          this.shuffledTrainIndex =
              (this.shuffledTrainIndex + 1) % this.trainIndices.length;
          return this.trainIndices[this.shuffledTrainIndex];
        });
  }

  nextTestBatch(batchSize) {
    return this.nextBatch(batchSize, [this.testImages, this.testLabels], () => {
      this.shuffledTestIndex =
          (this.shuffledTestIndex + 1) % this.testIndices.length;
      return this.testIndices[this.shuffledTestIndex];
    });
  }

  nextBatch(batchSize, data, index) {
    const batchImagesArray = new Float32Array(batchSize * IMAGE_SIZE);
    const batchLabelsArray = new Uint8Array(batchSize * NUM_CLASSES);

    for (let i = 0; i < batchSize; i++) {
      const idx = index();

      const image =
          data[0].slice(idx * IMAGE_SIZE, idx * IMAGE_SIZE + IMAGE_SIZE);
      batchImagesArray.set(image, i * IMAGE_SIZE);

      const label =
          data[1].slice(idx * NUM_CLASSES, idx * NUM_CLASSES + NUM_CLASSES);
      batchLabelsArray.set(label, i * NUM_CLASSES);
    }

    const xs = tf.tensor2d(batchImagesArray, [batchSize, IMAGE_SIZE]);
    const labels = tf.tensor2d(batchLabelsArray, [batchSize, NUM_CLASSES]);

    return {xs, labels};
  }
}

/**
 * 数据处理工具 - 用于加载和预处理数据集
 */


/**
 * 从CSV数据创建训练张量
 * @param {Array} data - CSV数据数组，每个元素是一个包含所有列的对象
 * @param {Object} options - 配置选项
 * @returns {Object} 包含xs和labels的训练数据对象
 */
export const createTensorsFromCSV = (data, options = {}) => {
  // 默认选项
  const defaults = {
    timeSteps: 1,         // 序列中的时间步数
    predictSteps: 1,      // 预测未来的步数
    targetColumn: null,   // 目标列名，默认为第一个数值列
    featureColumns: null, // 特征列名，默认为所有数值列
    isTimeSeries: false,  // 是否为时间序列数据
    outputShape: '2d',    // 输出张量形状：'2d'或'3d'
    shuffle: true,        // 是否随机打乱数据
    splitRatio: 0.8       // 训练集比例
  };
  
  // 合并用户选项
  const config = { ...defaults, ...options };
  
  console.log('Processing CSV data with config:', config);
  console.log('CSV data length:', data?.length || 0);
  
  // 检查数据是否有效
  if (!data || data.length === 0) {
    console.error('Empty or invalid CSV data');
    return { xs: null, labels: null };
  }
  
  try {
    // 获取所有数值列
    const allNumericColumns = Object.keys(data[0]).filter(key => {
      const value = data[0][key];
      return typeof value === 'number' || !isNaN(parseFloat(value));
    });
    
    console.log('All numeric columns:', allNumericColumns);
    
    if (allNumericColumns.length === 0) {
      throw new Error('No numeric columns found in CSV data');
    }
    
    // 确定特征列
    const featureColumns = config.featureColumns || 
                          allNumericColumns.filter(col => col !== config.targetColumn);
    
    // 确定目标列
    const targetColumn = config.targetColumn || allNumericColumns[0];
    
    console.log('Feature columns:', featureColumns);
    console.log('Target column:', targetColumn);
    
    // 提取特征和目标值
    const rawFeatures = data.map(row => {
      return featureColumns.map(col => {
        const value = typeof row[col] === 'number' ? row[col] : parseFloat(row[col]);
        return isNaN(value) ? 0 : value;
      });
    });
    
    const rawTargets = data.map(row => {
      const value = typeof row[targetColumn] === 'number' ? 
                    row[targetColumn] : 
                    parseFloat(row[targetColumn]);
      return isNaN(value) ? 0 : value;
    });
    
    // 归一化数据
    const { features, featureMin, featureMax } = normalizeData(rawFeatures);
    const { features: targets, featureMin: targetMin, featureMax: targetMax } = normalizeData(rawTargets.map(v => [v]));
    
    console.log('Normalized data shapes - Features:', features.length, 'x', features[0]?.length || 0);
    console.log('Targets:', targets.length, 'x', 1);
    
    // 根据是否为时间序列创建不同的输入输出
    let xs, ys;
    
    if (config.isTimeSeries && config.timeSteps > 1) {
      // 创建时间序列数据
      const { sequences, labels } = createTimeseriesData(
        features, 
        targets.map(t => t[0]), 
        config.timeSteps, 
        config.predictSteps
      );
      
      // 创建3D张量 [样本数, 时间步数, 特征数]
      xs = tf.tensor3d(sequences);
      
      // 创建2D张量 [样本数, 输出维度]
      ys = tf.tensor2d(labels);
      
      console.log('Created time series tensors with shapes - xs:', xs.shape, 'ys:', ys.shape);
    } else {
      // 非时间序列数据 - 根据需要的输出形状创建
      if (config.outputShape === '3d') {
        // 添加时间步维度 [样本数, 时间步=1, 特征数]
        const reshapedFeatures = features.map(f => [f]);
        xs = tf.tensor3d(reshapedFeatures);
      } else {
        // 标准2D张量 [样本数, 特征数]
        xs = tf.tensor2d(features);
      }
      
      // 目标值始终为2D [样本数, 输出维度=1]
      ys = tf.tensor2d(targets);
      
      console.log('Created standard tensors with shapes - xs:', xs.shape, 'ys:', ys.shape);
    }
    
    // 可选：随机打乱数据
    if (config.shuffle && xs.shape[0] > 1) {
      const {xs: shuffledXs, ys: shuffledYs} = shuffleData(xs, ys);
      xs = shuffledXs;
      ys = shuffledYs;
      console.log('Data shuffled');
    }
    
    return {
      xs,         // 输入特征
      labels: ys, // 标签
      // 元数据
      meta: {
        featureColumns,
        targetColumn,
        featureMin,
        featureMax,
        targetMin,
        targetMax,
        timeSteps: config.timeSteps,
        isTimeSeries: config.isTimeSeries
      }
    };
    
  } catch (error) {
    console.error('Error processing CSV data:', error);
    alert(`数据处理错误: ${error.message}`);
    return { xs: null, labels: null, error };
  }
};

/**
 * 将数据归一化到[0,1]范围
 * @param {Array} data - 要归一化的2D数组
 * @returns {Object} 归一化后的数据及最小/最大值
 */
function normalizeData(data) {
  if (!data || data.length === 0) {
    return { features: [], featureMin: [], featureMax: [] };
  }
  
  const isNestedArray = Array.isArray(data[0]);
  const numFeatures = isNestedArray ? data[0].length : 1;
  
  // 初始化最小最大值数组
  const featureMin = Array(numFeatures).fill(Number.MAX_SAFE_INTEGER);
  const featureMax = Array(numFeatures).fill(Number.MIN_SAFE_INTEGER);
  
  // 处理2D数组或1D数组
  const processValue = (value, index) => {
    if (value < featureMin[index]) featureMin[index] = value;
    if (value > featureMax[index]) featureMax[index] = value;
  };
  
  // 找出最小最大值
  if (isNestedArray) {
    // 2D数组
    for (const row of data) {
      for (let i = 0; i < numFeatures; i++) {
        processValue(row[i], i);
      }
    }
  } else {
    // 1D数组
    for (let i = 0; i < data.length; i++) {
      processValue(data[i], 0);
    }
  }
  
  // 防止除以零（如果最小值等于最大值）
  for (let i = 0; i < numFeatures; i++) {
    if (featureMin[i] === featureMax[i]) {
      featureMax[i] = featureMin[i] + 1;
    }
  }
  
  // 归一化数据
  let features;
  if (isNestedArray) {
    features = data.map(row => {
      return row.map((val, i) => (val - featureMin[i]) / (featureMax[i] - featureMin[i]));
    });
  } else {
    features = data.map(val => [(val - featureMin[0]) / (featureMax[0] - featureMin[0])]);
  }
  
  return { features, featureMin, featureMax };
}

/**
 * 创建时间序列数据
 * @param {Array} features - 归一化后的特征
 * @param {Array} targets - 归一化后的目标值
 * @param {number} timeSteps - 历史时间步长
 * @param {number} predictSteps - 预测步长
 * @returns {Object} 包含序列和对应标签的对象
 */
function createTimeseriesData(features, targets, timeSteps, predictSteps) {
  const sequences = [];
  const labels = [];
  
  // 确保数据长度足够
  if (features.length < timeSteps + predictSteps) {
    throw new Error(`数据长度不足: 需要至少 ${timeSteps + predictSteps} 个样本，但只有 ${features.length} 个`);
  }
  
  // 创建滑动窗口
  for (let i = 0; i <= features.length - timeSteps - predictSteps; i++) {
    // 输入序列
    const sequence = features.slice(i, i + timeSteps);
    sequences.push(sequence);
    
    // 预测目标 (预测未来predictSteps的值)
    const label = [targets[i + timeSteps + predictSteps - 1]];
    labels.push(label);
  }
  
  return { sequences, labels };
}

/**
 * 打乱数据但保持xs和ys的对应关系
 * @param {Tensor} xs - 特征张量
 * @param {Tensor} ys - 标签张量
 * @returns {Object} 打乱后的特征和标签
 */
function shuffleData(xs, ys) {
  return tf.tidy(() => {
    const indices = tf.util.createShuffledIndices(xs.shape[0]);
    
    return {
      xs: tf.gather(xs, indices),
      ys: tf.gather(ys, indices)
    };
  });
}

/**
 * 检查并调整张量形状以匹配目标形状
 * @param {Tensor} tensor - 输入张量
 * @param {Array} targetShape - 目标形状
 * @returns {Tensor} 调整后的张量
 */
export const reshapeTensor = (tensor, targetShape) => {
  if (!tensor) return null;
  
  try {
    console.log('Reshaping tensor from', tensor.shape, 'to', targetShape);
    
    // 检查目标形状是否兼容
    const targetSize = targetShape.reduce((acc, dim) => {
      // 跳过未知维度(-1或null)
      if (dim === -1 || dim === null) return acc;
      return acc * dim;
    }, 1);
    
    const currentSize = tensor.size;
    
    // 计算未知维度的大小
    const newShape = [...targetShape];
    let unknownDimIndex = -1;
    
    for (let i = 0; i < newShape.length; i++) {
      if (newShape[i] === -1 || newShape[i] === null) {
        if (unknownDimIndex === -1) {
          unknownDimIndex = i;
          // 计算未知维度的值
          const knownDimsProduct = targetSize;
          newShape[i] = Math.floor(currentSize / knownDimsProduct);
        } else {
          // 多个未知维度，无法确定形状
          throw new Error('目标形状中不能有多个未知维度');
        }
      }
    }
    
    // 重塑张量
    return tensor.reshape(newShape);
  } catch (error) {
    console.error('Error reshaping tensor:', error);
    throw error;
  }
};

export default {
  createTensorsFromCSV,
  reshapeTensor
};