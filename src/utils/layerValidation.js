/**
 * 层验证工具 - 用于验证神经网络层之间的兼容性
 */

// 实用函数：计算卷积后的输出形状
function calculateConvOutputShape(inputShape, config) {
  // 对于Conv2D，我们需要计算输出的高度和宽度
  const { kernelSize = 5, strides = 1, padding = 'valid' } = config || {};
  
  // 如果输入形状不存在或者没有高度和宽度信息，返回null
  if (!inputShape || !inputShape.shape || inputShape.shape.length < 2) {
    return null;
  }
  
  let inputHeight, inputWidth, inputChannels;
  
  // 根据输入维度不同进行处理
  if (inputShape.dimensions === 3) {
    // 3D输入: [height, width, channels]
    [inputHeight, inputWidth, inputChannels] = inputShape.shape;
  } else if (inputShape.dimensions === 4) {
    // 4D输入: [batch, height, width, channels]
    [, inputHeight, inputWidth, inputChannels] = inputShape.shape;
  } else {
    return null; // 不支持其他维度
  }
  
  // 计算输出高度和宽度
  let outputHeight, outputWidth;
  if (padding === 'valid') {
    outputHeight = Math.floor((inputHeight - kernelSize) / strides) + 1;
    outputWidth = Math.floor((inputWidth - kernelSize) / strides) + 1;
  } else if (padding === 'same') {
    outputHeight = Math.ceil(inputHeight / strides);
    outputWidth = Math.ceil(inputWidth / strides);
  } else {
    return null; // 不支持其他填充方式
  }
  
  // 输出过滤器数量等于filters参数
  const outputChannels = config.filters || 1;
  
  // 构建输出形状
  const outputShape = inputShape.dimensions === 3 
    ? [outputHeight, outputWidth, outputChannels]
    : [null, outputHeight, outputWidth, outputChannels];
  
  return {
    dimensions: inputShape.dimensions,
    shape: outputShape,
    description: `${inputShape.dimensions}D张量 (${outputShape.join(', ')})`
  };
}

// 计算池化层输出形状
function calculatePoolingOutputShape(inputShape, config) {
  const { poolSize = [2, 2], strides = [2, 2], padding = 'valid' } = config || {};
  
  // 如果输入形状不存在或者没有高度和宽度信息，返回null
  if (!inputShape || !inputShape.shape || inputShape.shape.length < 2) {
    return null;
  }
  
  let inputHeight, inputWidth, inputChannels;
  
  // 根据输入维度不同进行处理
  if (inputShape.dimensions === 3) {
    // 3D输入: [height, width, channels]
    [inputHeight, inputWidth, inputChannels] = inputShape.shape;
  } else if (inputShape.dimensions === 4) {
    // 4D输入: [batch, height, width, channels]
    [, inputHeight, inputWidth, inputChannels] = inputShape.shape;
  } else {
    return null; // 不支持其他维度
  }
  
  // 确保poolSize和strides是数组
  const poolHeight = Array.isArray(poolSize) ? poolSize[0] : poolSize;
  const poolWidth = Array.isArray(poolSize) ? poolSize[1] : poolSize;
  const strideHeight = Array.isArray(strides) ? strides[0] : strides;
  const strideWidth = Array.isArray(strides) ? strides[1] : strides;
  
  // 计算输出高度和宽度
  let outputHeight, outputWidth;
  if (padding === 'valid') {
    outputHeight = Math.floor((inputHeight - poolHeight) / strideHeight) + 1;
    outputWidth = Math.floor((inputWidth - poolWidth) / strideWidth) + 1;
  } else if (padding === 'same') {
    outputHeight = Math.ceil(inputHeight / strideHeight);
    outputWidth = Math.ceil(inputWidth / strideWidth);
  } else {
    return null; // 不支持其他填充方式
  }
  
  // 池化不改变通道数
  const outputChannels = inputChannels;
  
  // 构建输出形状
  const outputShape = inputShape.dimensions === 3 
    ? [outputHeight, outputWidth, outputChannels]
    : [null, outputHeight, outputWidth, outputChannels];
  
  return {
    dimensions: inputShape.dimensions,
    shape: outputShape,
    description: `${inputShape.dimensions}D张量 (${outputShape.join(', ')})`
  };
}

// 计算展平层输出形状
function calculateFlattenOutputShape(inputShape) {
  if (!inputShape || !inputShape.shape) {
    return null;
  }
  
  // 计算展平后的特征数
  let features = 1;
  let startIdx = 0;
  
  // 如果是4D输入，跳过batch维度
  if (inputShape.dimensions === 4) {
    startIdx = 1;
  }
  
  // 计算所有维度的乘积(除了batch维度)
  for (let i = startIdx; i < inputShape.shape.length; i++) {
    if (inputShape.shape[i] !== null) {
      features *= inputShape.shape[i];
    } else {
      // 如果有未知维度，无法计算准确特征数
      features = null;
      break;
    }
  }
  
  // 输出形状为[batch, features]
  return {
    dimensions: 2,
    shape: [null, features],
    description: `2D张量 (batch, ${features || '?'})`
  };
}

// 计算重塑层的输出形状
function calculateReshapeOutputShape(inputShape, config) {
  if (!inputShape || !inputShape.shape) {
    return null;
  }
  
  // 解析目标形状
  let targetShape;
  if (typeof config.targetShape === 'string') {
    // 从字符串解析，如"(None, 7, 4)"
    targetShape = config.targetShape
      .replace(/[()]/g, '')
      .split(',')
      .map(item => {
        item = item.trim();
        return item === 'None' || item === 'null' ? null : parseInt(item, 10);
      });
  } else if (Array.isArray(config.targetShape)) {
    targetShape = config.targetShape;
  } else {
    // 默认形状
    targetShape = [null, 1, 1, 1];
  }
  
  // 计算输入的总元素数
  let inputElements = 1;
  for (let i = 0; i < inputShape.shape.length; i++) {
    if (inputShape.shape[i] !== null) {
      inputElements *= inputShape.shape[i];
    }
  }
  
  // 计算目标形状的已知元素数
  let targetElements = 1;
  let hasUnknownDim = false;
  for (let i = 0; i < targetShape.length; i++) {
    if (targetShape[i] !== null) {
      targetElements *= targetShape[i];
    } else {
      hasUnknownDim = true;
    }
  }
  
  // 如果目标形状有未知维度，我们无法验证元素数量匹配
  let isCompatible = hasUnknownDim || (inputElements === targetElements);
  
  // 添加batch维度
  const outputShape = [null, ...targetShape];
  
  return {
    dimensions: outputShape.length,
    shape: outputShape,
    description: `${outputShape.length}D张量 (${outputShape.join(', ')})`,
    compatible: isCompatible
  };
}

// 各层类型的输入/输出形状期望
const layerExpectations = {
  // 数据源层
  useData: {
    inputShapes: [],
    outputShape: () => ({ 
      dimensions: 3, 
      shape: [28, 28, 1], // 假设为图像数据
      description: "图像数据 (28, 28, 1)" 
    })
  },
  mnist: {
    inputShapes: [],
    outputShape: () => ({ 
      dimensions: 4, 
      shape: [null, 28, 28, 1], 
      description: "MNIST数据 (batch, 28, 28, 1)" 
    })
  },
  
  // 卷积层
  conv2d: {
    inputShapes: [
      { dimensions: 3, description: "3D张量 (height, width, channels)" },
      { dimensions: 4, description: "4D张量 (batch, height, width, channels)" }
    ],
    outputShape: (inputShape, config) => {
      return calculateConvOutputShape(inputShape, config);
    }
  },
  
  // 池化层
  maxPooling2d: {
    inputShapes: [
      { dimensions: 3, description: "3D张量 (height, width, channels)" },
      { dimensions: 4, description: "4D张量 (batch, height, width, channels)" }
    ],
    outputShape: (inputShape, config) => {
      return calculatePoolingOutputShape(inputShape, config);
    }
  },
  avgPooling2d: {
    inputShapes: [
      { dimensions: 3, description: "3D张量 (height, width, channels)" },
      { dimensions: 4, description: "4D张量 (batch, height, width, channels)" }
    ],
    outputShape: (inputShape, config) => {
      return calculatePoolingOutputShape(inputShape, config);
    }
  },
  
  // 展平层
  flatten: {
    inputShapes: [
      { dimensions: 3, description: "3D张量 (height, width, channels)" },
      { dimensions: 4, description: "4D张量 (batch, height, width, channels)" }
    ],
    outputShape: (inputShape) => calculateFlattenOutputShape(inputShape)
  },
  
  // 全连接层
  dense: {
    inputShapes: [
      { dimensions: 2, description: "2D张量 (batch, features)" }
    ],
    outputShape: (inputShape, config) => {
      const units = config?.units || 10;
      return { 
        dimensions: 2, 
        shape: [null, units],
        description: `2D张量 (batch, ${units})` 
      };
    }
  },
  
  // 循环层
  lstm: {
    inputShapes: [
      { dimensions: 3, description: "3D张量 (batch, time_steps, features)" }
    ],
    outputShape: (inputShape, config) => {
      const returnSequences = config?.returnSequences || false;
      const units = config?.units || 128;
      
      if (returnSequences) {
        // 如果返回序列，维持3D形状
        return {
          dimensions: 3,
          shape: inputShape?.shape ? [inputShape.shape[0], inputShape.shape[1], units] : [null, null, units],
          description: `3D张量 (batch, time_steps, ${units})`
        };
      } else {
        // 如果不返回序列，压缩为2D
        return {
          dimensions: 2,
          shape: [null, units],
          description: `2D张量 (batch, ${units})`
        };
      }
    }
  },
  gru: {
    inputShapes: [
      { dimensions: 3, description: "3D张量 (batch, time_steps, features)" }
    ],
    outputShape: (inputShape, config) => {
      const returnSequences = config?.returnSequences || false;
      const units = config?.units || 128;
      
      if (returnSequences) {
        return {
          dimensions: 3,
          shape: inputShape?.shape ? [inputShape.shape[0], inputShape.shape[1], units] : [null, null, units],
          description: `3D张量 (batch, time_steps, ${units})`
        };
      } else {
        return {
          dimensions: 2,
          shape: [null, units],
          description: `2D张量 (batch, ${units})`
        };
      }
    }
  },
  
  // 重塑层
  reshape: {
    inputShapes: [
      { dimensions: 2, description: "2D张量 (batch, features)" },
      { dimensions: 3, description: "3D张量 (batch, dim1, dim2)" },
      { dimensions: 4, description: "4D张量 (batch, dim1, dim2, dim3)" }
    ],
    outputShape: (inputShape, config) => calculateReshapeOutputShape(inputShape, config)
  },
  
  // 正则化层 - 这些层不改变形状
  dropout: {
    inputShapes: [
      { dimensions: 2, description: "2D张量" },
      { dimensions: 3, description: "3D张量" },
      { dimensions: 4, description: "4D张量" }
    ],
    outputShape: (inputShape) => {
      return inputShape ? { ...inputShape } : null;
    }
  },
  batchNorm: {
    inputShapes: [
      { dimensions: 2, description: "2D张量" },
      { dimensions: 3, description: "3D张量" },
      { dimensions: 4, description: "4D张量" }
    ],
    outputShape: (inputShape) => {
      return inputShape ? { ...inputShape } : null;
    }
  },
  
  // 激活层
  activation: {
    inputShapes: [
      { dimensions: 2, description: "2D张量" },
      { dimensions: 3, description: "3D张量" },
      { dimensions: 4, description: "4D张量" }
    ],
    outputShape: (inputShape) => {
      return inputShape ? { ...inputShape } : null;
    }
  },
  
  // 训练按钮不参与连接验证
  trainButton: {
    inputShapes: [],
    outputShape: () => null
  }
};

/**
 * 验证两个层之间的连接兼容性
 * @param {string} sourceType 源层类型
 * @param {string} targetType 目标层类型
 * @param {object} sourceConfig 源层配置
 * @param {object} targetConfig 目标层配置
 * @param {object} inputShape 可选的源层输入形状，用于传递形状信息
 * @returns {object} 验证结果 {valid, message, outputShape}
 */
export function validateConnection(sourceType, targetType, sourceConfig = {}, targetConfig = {}, inputShape = null) {
  // 获取源层的期望
  const sourceExpectation = layerExpectations[sourceType];
  if (!sourceExpectation) {
    return { valid: false, message: `未知层类型: ${sourceType}` };
  }
  
  // 获取目标层的期望
  const targetExpectation = layerExpectations[targetType];
  if (!targetExpectation) {
    return { valid: false, message: `未知层类型: ${targetType}` };
  }
  
  // 如果目标层没有输入要求（例如数据源层），则不能作为目标
  if (targetExpectation.inputShapes.length === 0) {
    return { valid: false, message: `${targetType} 不能作为目标层，它没有输入要求` };
  }
  
  // 计算源层的输出形状
  let sourceOutput;
  if (sourceType === 'useData' || sourceType === 'mnist') {
    // 数据源层有固定输出
    sourceOutput = sourceExpectation.outputShape();
  } else {
    // 处理层的输出取决于它的输入和配置
    sourceOutput = sourceExpectation.outputShape(inputShape, sourceConfig);
  }
  
  if (!sourceOutput) {
    return { valid: false, message: `${sourceType} 不能计算有效的输出形状` };
  }
  
  // 检查目标层的输入期望是否与源层的输出维度匹配
  const compatibleInputShape = targetExpectation.inputShapes.find(shape => 
    shape.dimensions === sourceOutput.dimensions
  );
  
  if (!compatibleInputShape) {
    // 构建详细的错误消息
    const expectedDims = targetExpectation.inputShapes.map(s => s.description).join(' 或 ');
    
    return {
      valid: false,
      message: `维度不兼容：${sourceType} 输出 ${sourceOutput.dimensions}D张量，但 ${targetType} 期望 ${expectedDims}`,
      sourceOutput
    };
  }
  
  // 对于特定的层类型进行额外验证
  if (targetType === 'reshape') {
    // 验证reshape层的目标形状与输入形状的元素数量是否兼容
    const targetOutputShape = targetExpectation.outputShape(sourceOutput, targetConfig);
    
    if (targetOutputShape && targetOutputShape.compatible === false) {
      return {
        valid: false,
        message: `Reshape层形状不兼容：输入元素数量与目标形状不匹配`,
        sourceOutput,
        targetOutput: targetOutputShape
      };
    }
  } else if (targetType === 'dense' && sourceOutput.dimensions !== 2) {
    // Dense层需要2D输入，如果源层输出不是2D，建议添加Flatten层
    return {
      valid: false,
      message: `Dense层需要2D输入，但得到了${sourceOutput.dimensions}D输出。需要在中间添加Flatten层。`,
      sourceOutput,
      needsFlatten: true
    };
  }
  
  // 计算目标层的预期输出形状
  const targetOutput = targetExpectation.outputShape(sourceOutput, targetConfig);
  
  return { 
    valid: true, 
    message: "连接兼容", 
    sourceOutput,
    targetOutput
  };
}

/**
 * 获取层的用户友好说明
 * @param {string} layerType 层类型
 * @returns {string} 层说明
 */
export function getLayerDescription(layerType) {
  const descriptions = {
    useData: "自定义数据源",
    mnist: "MNIST数据集",
    conv2d: "二维卷积层",
    maxPooling2d: "最大池化层",
    avgPooling2d: "平均池化层",
    flatten: "展平层",
    dense: "全连接层",
    dropout: "Dropout正则化层",
    batchNorm: "批量归一化层",
    activation: "激活函数层",
    lstm: "长短期记忆网络层",
    gru: "门控循环单元层",
    reshape: "形状重塑层",
    trainButton: "训练控制"
  };
  
  return descriptions[layerType] || layerType;
}

/**
 * 获取层输出形状的说明文本
 * @param {string} layerType 层类型
 * @param {object} config 层配置
 * @param {object} inputShape 输入形状
 * @returns {string} 形状描述文本
 */
export function getLayerShapeDescription(layerType, config, inputShape) {
  const layerExpectation = layerExpectations[layerType];
  if (!layerExpectation) return "未知";
  
  const outputShape = layerExpectation.outputShape(inputShape, config);
  if (!outputShape) return "无法确定";
  
  return outputShape.description;
}

/**
 * 根据模型中的所有节点计算完整路径上的形状兼容性
 * @param {Array} nodes 模型中的所有节点
 * @param {Array} edges 节点之间的连接
 * @returns {Object} 包含每个节点输入输出形状的映射
 */
export function calculateModelShapes(nodes, edges) {
  // 初始化结果对象
  const shapeMap = {};
  
  // 找到起始节点（数据源）
  const startNodes = nodes.filter(node => 
    node.type === 'useData' || node.type === 'mnist'
  );
  
  if (startNodes.length === 0) {
    return { valid: false, message: "模型中没有数据源节点" };
  }
  
  // 对每个起始节点执行形状传播
  for (const startNode of startNodes) {
    // 初始化形状映射
    shapeMap[startNode.id] = {
      outputShape: layerExpectations[startNode.type].outputShape(),
      type: startNode.type
    };
    
    // 构建处理顺序（拓扑排序）
    const processOrder = [];
    const visited = new Set();
    const queue = [startNode.id];
    
    while (queue.length > 0) {
      const nodeId = queue.shift();
      if (visited.has(nodeId)) continue;
      
      visited.add(nodeId);
      processOrder.push(nodeId);
      
      // 找到所有以当前节点为源的边
      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      for (const edge of outgoingEdges) {
        queue.push(edge.target);
      }
    }
    
    // 按照拓扑顺序处理每个节点
    for (let i = 0; i < processOrder.length; i++) {
      const nodeId = processOrder[i];
      const node = nodes.find(n => n.id === nodeId);
      
      // 跳过已经处理过的数据源节点
      if (i === 0 && (node.type === 'useData' || node.type === 'mnist')) {
        continue;
      }
      
      // 找到输入节点
      const incomingEdges = edges.filter(edge => edge.target === nodeId);
      if (incomingEdges.length === 0) {
        // 没有输入的非数据源节点
        if (node.type !== 'useData' && node.type !== 'mnist') {
          shapeMap[nodeId] = { error: "节点没有输入连接" };
        }
        continue;
      }
      
      // 获取输入节点的输出形状
      const sourceNodeId = incomingEdges[0].source;
      const sourceShape = shapeMap[sourceNodeId]?.outputShape;
      
      if (!sourceShape) {
        shapeMap[nodeId] = { error: "无法确定输入形状" };
        continue;
      }
      
      // 验证连接并计算输出形状
      const sourceNode = nodes.find(n => n.id === sourceNodeId);
      const validation = validateConnection(
        sourceNode.type,
        node.type,
        sourceNode.config || {},
        node.config || {},
        sourceShape
      );
      
      if (!validation.valid) {
        shapeMap[nodeId] = { 
          error: validation.message,
          inputShape: validation.sourceOutput
        };
      } else {
        shapeMap[nodeId] = {
          inputShape: validation.sourceOutput,
          outputShape: validation.targetOutput,
          type: node.type
        };
      }
    }
  }
  
  return shapeMap;
}

export default {
  validateConnection,
  getLayerDescription,
  getLayerShapeDescription,
  calculateModelShapes,
  layerExpectations
}; 