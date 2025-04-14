/**
 * 层验证工具 - 用于验证神经网络层之间的兼容性
 */

// 各层类型的输入/输出形状期望
const layerExpectations = {
  // 数据源层
  useData: {
    inputShapes: [],
    outputShape: () => ({ dimensions: 3, description: "图像数据 (height, width, channels)" })
  },
  mnist: {
    inputShapes: [],
    outputShape: () => ({ dimensions: 4, description: "MNIST数据 (batch, 28, 28, 1)" })
  },
  
  // 卷积层
  conv2d: {
    inputShapes: [
      { dimensions: 3, description: "3D张量 (height, width, channels)" },
      { dimensions: 4, description: "4D张量 (batch, height, width, channels)" }
    ],
    outputShape: (inputShape, config) => {
      return { dimensions: inputShape?.dimensions || 4, description: "卷积后的特征图" };
    }
  },
  
  // 池化层
  maxPooling2d: {
    inputShapes: [
      { dimensions: 3, description: "3D张量 (height, width, channels)" },
      { dimensions: 4, description: "4D张量 (batch, height, width, channels)" }
    ],
    outputShape: (inputShape) => {
      return { dimensions: inputShape?.dimensions || 4, description: "池化后的特征图" };
    }
  },
  avgPooling2d: {
    inputShapes: [
      { dimensions: 3, description: "3D张量 (height, width, channels)" },
      { dimensions: 4, description: "4D张量 (batch, height, width, channels)" }
    ],
    outputShape: (inputShape) => {
      return { dimensions: inputShape?.dimensions || 4, description: "池化后的特征图" };
    }
  },
  
  // 展平层
  flatten: {
    inputShapes: [
      { dimensions: 3, description: "3D张量" },
      { dimensions: 4, description: "4D张量" }
    ],
    outputShape: () => ({ dimensions: 2, description: "2D张量 (batch, features)" })
  },
  
  // 全连接层
  dense: {
    inputShapes: [
      { dimensions: 2, description: "2D张量 (batch, features)" }
    ],
    outputShape: (inputShape, config) => {
      return { dimensions: 2, description: "2D张量 (batch, units)" };
    }
  },
  
  // 循环层
  lstm: {
    inputShapes: [
      { dimensions: 3, description: "3D张量 (batch, time_steps, features)" }
    ],
    outputShape: (inputShape, config) => {
      const returnSequences = config?.returnSequences || false;
      return {
        dimensions: returnSequences ? 3 : 2,
        description: returnSequences ? "3D张量 (batch, time_steps, units)" : "2D张量 (batch, units)"
      };
    }
  },
  gru: {
    inputShapes: [
      { dimensions: 3, description: "3D张量 (batch, time_steps, features)" }
    ],
    outputShape: (inputShape, config) => {
      const returnSequences = config?.returnSequences || false;
      return {
        dimensions: returnSequences ? 3 : 2,
        description: returnSequences ? "3D张量 (batch, time_steps, units)" : "2D张量 (batch, units)"
      };
    }
  },
  
  // 重塑层
  reshape: {
    inputShapes: [
      { dimensions: 2, description: "2D张量" },
      { dimensions: 3, description: "3D张量" },
      { dimensions: 4, description: "4D张量" }
    ],
    outputShape: (inputShape, config) => {
      const targetShape = config?.targetShape || [1, 1, 1];
      const dims = targetShape.length + 1; // +1 for batch dimension
      return { dimensions: dims, description: `${dims}D张量 (batch, ${targetShape.join(', ')})` };
    }
  },
  
  // 正则化层
  dropout: {
    inputShapes: [
      { dimensions: 2, description: "2D张量" },
      { dimensions: 3, description: "3D张量" },
      { dimensions: 4, description: "4D张量" }
    ],
    outputShape: (inputShape) => {
      return { ...inputShape, description: `与输入相同 (${inputShape?.description || '未知'})` };
    }
  },
  batchNorm: {
    inputShapes: [
      { dimensions: 2, description: "2D张量" },
      { dimensions: 3, description: "3D张量" },
      { dimensions: 4, description: "4D张量" }
    ],
    outputShape: (inputShape) => {
      return { ...inputShape, description: `与输入相同 (${inputShape?.description || '未知'})` };
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
      return { ...inputShape, description: `与输入相同 (${inputShape?.description || '未知'})` };
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
 * @returns {object} 验证结果 {valid, message}
 */
export function validateConnection(sourceType, targetType, sourceConfig = {}, targetConfig = {}) {
  // 获取源层的输出形状
  const sourceExpectation = layerExpectations[sourceType];
  if (!sourceExpectation) {
    return { valid: false, message: `未知层类型: ${sourceType}` };
  }
  
  // 获取目标层的输入形状期望
  const targetExpectation = layerExpectations[targetType];
  if (!targetExpectation) {
    return { valid: false, message: `未知层类型: ${targetType}` };
  }
  
  // 如果目标层没有输入要求（例如数据源层），则不能作为目标
  if (targetExpectation.inputShapes.length === 0) {
    return { valid: false, message: `${targetType} 不能作为目标层，它没有输入要求` };
  }
  
  // 如果源层没有输出（例如训练按钮），则不能作为源
  const sourceOutput = sourceExpectation.outputShape(null, sourceConfig);
  if (!sourceOutput) {
    return { valid: false, message: `${sourceType} 不能作为源层，它没有输出` };
  }
  
  // 检查目标层的输入期望是否与源层的输出匹配
  const isCompatible = targetExpectation.inputShapes.some(shape => 
    shape.dimensions === sourceOutput.dimensions
  );
  
  if (!isCompatible) {
    // 构建详细的错误消息
    const expectedDims = targetExpectation.inputShapes.map(s => s.description).join(' 或 ');
    
    return {
      valid: false,
      message: `形状不兼容：${sourceType} 输出 ${sourceOutput.description}，但 ${targetType} 期望 ${expectedDims}`
    };
  }
  
  // 特殊情况检查
  if (targetType === 'reshape') {
    // 确保reshape层的目标形状与输入元素数量兼容
    // 这里简化处理，实际应用中可能需要更复杂的逻辑
    return { valid: true, message: "注意：请确保reshape目标形状的元素总数与输入兼容" };
  }
  
  return { valid: true, message: "连接兼容" };
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

export default {
  validateConnection,
  getLayerDescription,
  layerExpectations
}; 