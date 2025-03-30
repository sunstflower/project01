/**
 * 模型生成器 - 将可视化模型结构转换为TensorFlow.js代码
 */

// 生成模型代码
export const generateModelCode = (modelStructure) => {
  if (!modelStructure || !Array.isArray(modelStructure) || modelStructure.length === 0) {
    return '// 请添加模型组件后再生成代码';
  }

  let code = `
// TensorFlow.js 模型定义代码
const createModel = () => {
  const model = tf.sequential();
  
`;

  // 添加各个层
  modelStructure.forEach((node, index) => {
    if (node.type === 'conv2d') {
      code += generateConv2DCode(node.config, index === 0);
    } else if (node.type === 'maxPooling2d') {
      code += generateMaxPooling2DCode(node.config);
    } else if (node.type === 'dense') {
      code += generateDenseCode(node.config);
    }
  });

  // 添加编译和训练方法
  code += `
  // 编译模型
  model.compile({
    optimizer: 'adam',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  
  return model;
};

// 训练模型函数
const trainModel = async (model, xs, ys) => {
  return await model.fit(xs, ys, {
    epochs: 10,
    callbacks: tfvis.show.fitCallbacks(
      { name: 'Training Performance' },
      ['loss', 'acc'],
      { height: 200, callbacks: ['onEpochEnd'] }
    )
  });
};

// 预测函数
const predict = (model, inputData) => {
  const prediction = model.predict(inputData);
  return prediction;
};
`;

  return code;
};

// 生成Conv2D层代码
const generateConv2DCode = (config, isFirstLayer) => {
  const { kernelSize = 5, filters = 8, strides = 1, activation = 'relu', kernelInitializer = 'varianceScaling' } = config || {};
  
  let code = `  // 添加Conv2D层\n`;
  if (isFirstLayer) {
    code += `  model.add(tf.layers.conv2d({\n    inputShape: [28, 28, 1],\n`;
  } else {
    code += `  model.add(tf.layers.conv2d({\n`;
  }
  
  code += `    kernelSize: ${kernelSize},\n`;
  code += `    filters: ${filters},\n`;
  code += `    strides: ${strides},\n`;
  code += `    activation: '${activation}',\n`;
  code += `    kernelInitializer: '${kernelInitializer}'\n`;
  code += `  }));\n\n`;
  
  return code;
};

// 生成MaxPooling2D层代码
const generateMaxPooling2DCode = (config) => {
  const { poolSize = [2, 2], strides = [2, 2] } = config || {};
  
  let code = `  // 添加MaxPooling2D层\n`;
  code += `  model.add(tf.layers.maxPooling2d({\n`;
  code += `    poolSize: [${poolSize[0]}, ${poolSize[1]}],\n`;
  code += `    strides: [${strides[0]}, ${strides[1]}]\n`;
  code += `  }));\n\n`;
  
  return code;
};

// 生成Dense层代码
const generateDenseCode = (config) => {
  const { units = 10, activation = 'softmax', kernelInitializer = 'varianceScaling' } = config || {};
  
  let code = `  // 添加Flatten层\n`;
  code += `  model.add(tf.layers.flatten());\n\n`;
  
  code += `  // 添加Dense层\n`;
  code += `  model.add(tf.layers.dense({\n`;
  code += `    units: ${units},\n`;
  code += `    activation: '${activation}',\n`;
  code += `    kernelInitializer: '${kernelInitializer}'\n`;
  code += `  }));\n\n`;
  
  return code;
};

// 整体模型定义和图连接验证
export const validateModelStructure = (nodes, edges) => {
  if (!nodes || nodes.length === 0) {
    return { valid: false, message: '模型为空，请添加至少一个组件' };
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
      message: `有未连接的节点: ${unconnectedNodes.map(n => n.type).join(', ')}`
    };
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
  
  while (queue.length > 0) {
    const currentId = queue.shift();
    
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    
    const current = adjacencyList[currentId];
    if (!current) continue;
    
    const { node } = current;
    modelStructure.push({
      type: node.type,
      config: node.data,
    });
    
    // 将所有未访问的邻居加入队列
    current.next.forEach(nextId => {
      if (!visited.has(nextId)) {
        queue.push(nextId);
      }
    });
  }
  
  return modelStructure;
}; 