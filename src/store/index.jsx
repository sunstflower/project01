import { create } from 'zustand';

const useStore = create((set) => ({
  isData: false,
  changeData: (data) => set(() => ({ isData: true, csvData: data })),

  csvData: [],
  addCsvData: (config) => set((state) => ({
    csvData: [...state.csvData, config]
  })),

  // 卷积层配置
  conv2dConfigs: {},
  addConv2dConfig: (nodeId) => set((state) => ({
    conv2dConfigs: {
      ...state.conv2dConfigs,
      [nodeId]: {
        kernelSize: 5,
        filters: 8,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
      }
    }
  })),
  updateConv2dConfig: (nodeId, config) => set((state) => ({
    conv2dConfigs: {
      ...state.conv2dConfigs,
      [nodeId]: {
        ...(state.conv2dConfigs[nodeId] || {}),
        ...config
      }
    }
  })),
  removeConv2dConfig: (nodeId) => set((state) => {
    const newConfigs = { ...state.conv2dConfigs };
    delete newConfigs[nodeId];
    return { conv2dConfigs: newConfigs };
  }),

  // 最大池化层配置
  maxPooling2dConfigs: {},
  addMaxPooling2dConfig: (nodeId) => set((state) => ({
    maxPooling2dConfigs: {
      ...state.maxPooling2dConfigs,
      [nodeId]: {
        poolSize: [2, 2],
        strides: [2, 2],
      }
    }
  })),
  updateMaxPooling2dConfig: (nodeId, config) => set((state) => ({
    maxPooling2dConfigs: {
      ...state.maxPooling2dConfigs,
      [nodeId]: {
        ...(state.maxPooling2dConfigs[nodeId] || {}),
        ...config
      }
    }
  })),
  removeMaxPooling2dConfig: (nodeId) => set((state) => {
    const newConfigs = { ...state.maxPooling2dConfigs };
    delete newConfigs[nodeId];
    return { maxPooling2dConfigs: newConfigs };
  }),

  // 全连接层配置 - 改为对象形式，基于节点ID
  denseConfigs: {},
  addDenseConfig: (nodeId) => set((state) => ({
    denseConfigs: {
      ...state.denseConfigs,
      [nodeId]: {
        units: 128,
        kernelInitializer: 'varianceScaling',
        activation: 'relu'
      }
    }
  })),
  updateDenseConfig: (nodeId, config) => set((state) => ({
    denseConfigs: {
      ...state.denseConfigs,
      [nodeId]: {
        ...(state.denseConfigs[nodeId] || {}),
        ...config
      }
    }
  })),
  removeDenseConfig: (nodeId) => set((state) => {
    const newConfigs = { ...state.denseConfigs };
    delete newConfigs[nodeId];
    return { denseConfigs: newConfigs };
  }),

  // 新增: Dropout层配置
  dropoutConfigs: {},
  addDropoutConfig: (nodeId) => set((state) => ({
    dropoutConfigs: {
      ...state.dropoutConfigs,
      [nodeId]: {
        rate: 0.2,
      }
    }
  })),
  updateDropoutConfig: (nodeId, config) => set((state) => ({
    dropoutConfigs: {
      ...state.dropoutConfigs,
      [nodeId]: {
        ...(state.dropoutConfigs[nodeId] || {}),
        ...config
      }
    }
  })),
  removeDropoutConfig: (nodeId) => set((state) => {
    const newConfigs = { ...state.dropoutConfigs };
    delete newConfigs[nodeId];
    return { dropoutConfigs: newConfigs };
  }),

  // 新增: BatchNormalization层配置
  batchNormConfigs: {},
  addBatchNormConfig: (nodeId) => set((state) => ({
    batchNormConfigs: {
      ...state.batchNormConfigs,
      [nodeId]: {
        axis: -1,
        momentum: 0.99,
        epsilon: 0.001,
        center: true,
        scale: true,
      }
    }
  })),
  updateBatchNormConfig: (nodeId, config) => set((state) => ({
    batchNormConfigs: {
      ...state.batchNormConfigs,
      [nodeId]: {
        ...(state.batchNormConfigs[nodeId] || {}),
        ...config
      }
    }
  })),
  removeBatchNormConfig: (nodeId) => set((state) => {
    const newConfigs = { ...state.batchNormConfigs };
    delete newConfigs[nodeId];
    return { batchNormConfigs: newConfigs };
  }),

  // 新增: Flatten层配置
  flattenConfigs: {},
  addFlattenConfig: (nodeId) => set((state) => ({
    flattenConfigs: {
      ...state.flattenConfigs,
      [nodeId]: {}
    }
  })),
  removeFlattenConfig: (nodeId) => set((state) => {
    const newConfigs = { ...state.flattenConfigs };
    delete newConfigs[nodeId];
    return { flattenConfigs: newConfigs };
  }),

  // 新增: LSTM层配置
  lstmConfigs: {},
  addLstmConfig: (nodeId) => set((state) => ({
    lstmConfigs: {
      ...state.lstmConfigs,
      [nodeId]: {
        units: 128,
        activation: 'tanh',
        recurrentActivation: 'sigmoid',
        returnSequences: false,
        goBackwards: false,
        dropout: 0.0,
        recurrentDropout: 0.0,
      }
    }
  })),
  updateLstmConfig: (nodeId, config) => set((state) => ({
    lstmConfigs: {
      ...state.lstmConfigs,
      [nodeId]: {
        ...(state.lstmConfigs[nodeId] || {}),
        ...config
      }
    }
  })),
  removeLstmConfig: (nodeId) => set((state) => {
    const newConfigs = { ...state.lstmConfigs };
    delete newConfigs[nodeId];
    return { lstmConfigs: newConfigs };
  }),

  // 新增: GRU层配置
  gruConfigs: [],
  addGruConfig: () => set((state) => ({
    gruConfigs: [...state.gruConfigs, {
      units: 128,
      activation: 'tanh',
      recurrentActivation: 'sigmoid',
      returnSequences: false,
      dropout: 0.0,
      recurrentDropout: 0.0,
    }]
  })),
  updateGruConfig: (index, config) => set((state) => ({
    gruConfigs: state.gruConfigs.map((c, i) => (i === index ? { ...c, ...config } : c))
  })),
  removeGruConfig: (index) => set((state) => ({
    gruConfigs: state.gruConfigs.filter((_, i) => i !== index)
  })),

  // 新增: 激活函数层配置
  activationConfigs: [],
  addActivationConfig: () => set((state) => ({
    activationConfigs: [...state.activationConfigs, {
      activation: 'relu',
    }]
  })),
  updateActivationConfig: (index, config) => set((state) => ({
    activationConfigs: state.activationConfigs.map((c, i) => (i === index ? { ...c, ...config } : c))
  })),
  removeActivationConfig: (index) => set((state) => ({
    activationConfigs: state.activationConfigs.filter((_, i) => i !== index)
  })),

  // 新增: 优化器配置
  optimizerConfig: {
    type: 'adam',
    learningRate: 0.001,
    beta1: 0.9,
    beta2: 0.999,
    epsilon: 1e-7,
    decay: 0.0,
  },
  updateOptimizerConfig: (config) => set((state) => ({
    optimizerConfig: {...state.optimizerConfig, ...config}
  })),

  // 新增: 损失函数配置
  lossConfig: {
    type: 'categoricalCrossentropy',
  },
  updateLossConfig: (config) => set((state) => ({
    lossConfig: {...state.lossConfig, ...config}
  })),

  // 新增: Reshape层配置
  reshapeConfigs: [],
  addReshapeConfig: () => set((state) => ({
    reshapeConfigs: [...state.reshapeConfigs, {
      targetShape: '(None, 7, 4)',
      inputFeatures: 4
    }]
  })),
  updateReshapeConfig: (index, config) => set((state) => ({
    reshapeConfigs: state.reshapeConfigs.map((c, i) => (i === index ? { ...c, ...config } : c))
  })),
  removeReshapeConfig: (index) => set((state) => ({
    reshapeConfigs: state.reshapeConfigs.filter((_, i) => i !== index)
  })),

  // 新增: 平均池化层配置
  avgPooling2dConfigs: [],
  addAvgPooling2dConfig: () => set((state) => ({
    avgPooling2dConfigs: [...state.avgPooling2dConfigs, {
      poolSize: '(2, 2)',
      strides: '(2, 2)',
      padding: 'valid',
    }]
  })),
  updateAvgPooling2dConfig: (index, config) => set((state) => ({
    avgPooling2dConfigs: state.avgPooling2dConfigs.map((c, i) => (i === index ? { ...c, ...config } : c))
  })),
  removeAvgPooling2dConfig: (index) => set((state) => ({
    avgPooling2dConfigs: state.avgPooling2dConfigs.filter((_, i) => i !== index)
  })),

  // 连接验证函数
  isValidConnection: (sourceType, targetType) => {
    // 数据源只能连接到处理层
    if (sourceType === 'useData' || sourceType === 'mnist') {
      return ['conv2d', 'dense', 'reshape', 'flatten', 'lstm', 'gru'].includes(targetType);
    }
    
    // 大多数层可以连接到任何其他处理层
    const processingLayers = ['conv2d', 'maxPooling2d', 'avgPooling2d', 'dense', 'dropout', 'batchNorm', 'flatten', 'activation', 'reshape', 'lstm', 'gru'];
    if (processingLayers.includes(sourceType)) {
      return processingLayers.includes(targetType) || targetType === 'optimizer' || targetType === 'loss';
    }
    
    // 优化器和损失函数是终端节点
    if (sourceType === 'optimizer' || sourceType === 'loss') {
      return false;
    }
    
    return false;
  },

  nodes: [],
  addNode: (type, configIndex, id) => set((state) => {
    const defaultPosition = { x: 100, y: 100 };
    let newNode = { 
      id: id || `${type}-${Date.now()}`, 
      type, 
      configIndex,
      position: defaultPosition,
      data: {
        index: configIndex,
        sequenceId: state.nodes.length
      }
    };
    
    // 添加对应的配置
    if (type === 'conv2d' && configIndex !== undefined) {
      state.addConv2dConfig(id);
    } else if (type === 'maxPooling2d' && configIndex !== undefined) {
      state.addMaxPooling2dConfig(id);
    } else if (type === 'dense' && configIndex !== undefined) {
      state.addDenseConfig(id);
    } else if (type === 'dropout' && configIndex !== undefined) {
      state.addDropoutConfig(id);
    } else if (type === 'batchNorm' && configIndex !== undefined) {
      state.addBatchNormConfig(id);
    } else if (type === 'flatten' && configIndex !== undefined) {
      state.addFlattenConfig(id);
    } else if (type === 'lstm' && configIndex !== undefined) {
      state.addLstmConfig(id);
    } else if (type === 'gru' && configIndex !== undefined) {
      state.addGruConfig();
    } else if (type === 'activation' && configIndex !== undefined) {
      state.addActivationConfig();
    } else if (type === 'reshape' && configIndex !== undefined) {
      state.addReshapeConfig();
    } else if (type === 'avgPooling2d' && configIndex !== undefined) {
      state.addAvgPooling2dConfig();
    }
    
    // 获取新节点数组
    const newNodes = [...state.nodes, newNode];
    
    // 如果有前一个节点，创建连接
    let newEdges = [...state.edges];
    if (state.nodes.length > 0) {
      const lastNode = state.nodes[state.nodes.length - 1];
      // 检查连接是否有效
      if (state.isValidConnection(lastNode.type, newNode.type)) {
        newEdges.push({
          id: `edge-${Date.now()}`,
          source: lastNode.id,
          target: newNode.id,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#007aff' }
        });
      }
    }
    
    return { 
      nodes: newNodes,
      edges: newEdges
    };
  }),
  removeNode: (nodeId) => set((state) => {
    // 找到要删除的节点
    const nodeToRemove = state.nodes.find(node => node.id === nodeId);
    if (!nodeToRemove) return state;

    // 删除相关的边
    const newEdges = state.edges.filter(edge => 
      edge.source !== nodeId && edge.target !== nodeId
    );

    // 删除节点
    const newNodes = state.nodes.filter(node => node.id !== nodeId);

    // 删除相关的配置
    if (nodeToRemove.type === 'conv2d' && nodeToRemove.configIndex !== undefined) {
      state.removeConv2dConfig(nodeToRemove.id);
    } else if (nodeToRemove.type === 'maxPooling2d' && nodeToRemove.configIndex !== undefined) {
      state.removeMaxPooling2dConfig(nodeToRemove.id);
    } else if (nodeToRemove.type === 'dense' && nodeToRemove.configIndex !== undefined) {
      state.removeDenseConfig(nodeToRemove.id);
    } else if (nodeToRemove.type === 'dropout' && nodeToRemove.configIndex !== undefined) {
      state.removeDropoutConfig(nodeToRemove.id);
    } else if (nodeToRemove.type === 'batchNorm' && nodeToRemove.configIndex !== undefined) {
      state.removeBatchNormConfig(nodeToRemove.id);
    } else if (nodeToRemove.type === 'flatten' && nodeToRemove.configIndex !== undefined) {
      state.removeFlattenConfig(nodeToRemove.id);
    } else if (nodeToRemove.type === 'lstm' && nodeToRemove.configIndex !== undefined) {
      state.removeLstmConfig(nodeToRemove.id);
    } else if (nodeToRemove.type === 'gru' && nodeToRemove.configIndex !== undefined) {
      state.removeGruConfig(nodeToRemove.configIndex);
    } else if (nodeToRemove.type === 'activation' && nodeToRemove.configIndex !== undefined) {
      state.removeActivationConfig(nodeToRemove.configIndex);
    } else if (nodeToRemove.type === 'reshape' && nodeToRemove.configIndex !== undefined) {
      state.removeReshapeConfig(nodeToRemove.configIndex);
    } else if (nodeToRemove.type === 'avgPooling2d' && nodeToRemove.configIndex !== undefined) {
      state.removeAvgPooling2dConfig(nodeToRemove.configIndex);
    }

    return { 
      nodes: newNodes,
      edges: newEdges
    };
  }),
  
  // 更新节点位置
  updateNodePosition: (nodeId, position) => set((state) => ({
    nodes: state.nodes.map(node => 
      node.id === nodeId ? { ...node, position } : node
    )
  })),
  
  // 获取模型结构以便生成代码
  getModelStructure: () => {
    const state = useStore.getState();
    return state.nodes.map(node => {
      if (node.type === 'conv2d') {
        return {
          type: 'conv2d',
          config: state.conv2dConfigs[node.id]
        };
      } else if (node.type === 'maxPooling2d') {
        return {
          type: 'maxPooling2d',
          config: state.maxPooling2dConfigs[node.id]
        };
      } else if (node.type === 'dense') {
        return {
          type: 'dense',
          config: state.denseConfigs[node.id]
        };
      } else if (node.type === 'dropout') {
        return {
          type: 'dropout',
          config: state.dropoutConfigs[node.id]
        };
      } else if (node.type === 'batchNorm') {
        return {
          type: 'batchNorm',
          config: state.batchNormConfigs[node.id]
        };
      } else if (node.type === 'flatten') {
        return {
          type: 'flatten',
          config: state.flattenConfigs[node.id]
        };
      } else if (node.type === 'lstm') {
        return {
          type: 'lstm',
          config: state.lstmConfigs[node.id]
        };
      } else if (node.type === 'gru') {
        return {
          type: 'gru',
          config: state.gruConfigs[node.configIndex]
        };
      } else if (node.type === 'activation') {
        return {
          type: 'activation',
          config: state.activationConfigs[node.configIndex]
        };
      } else if (node.type === 'optimizer') {
        return {
          type: 'optimizer',
          config: state.optimizerConfig
        };
      } else if (node.type === 'loss') {
        return {
          type: 'loss',
          config: state.lossConfig
        };
      } else if (node.type === 'reshape') {
        return {
          type: 'reshape',
          config: state.reshapeConfigs[node.configIndex]
        };
      } else if (node.type === 'avgPooling2d') {
        return {
          type: 'avgPooling2d',
          config: state.avgPooling2dConfigs[node.configIndex]
        };
      } else {
        return { type: node.type };
      }
    });
  },

  edges: [],
  addEdge: (source, target) => set((state) => ({
    edges: [...state.edges, { 
      id: `edge-${Date.now()}`,
      source, 
      target,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#007aff' }
    }]
  })),
  removeEdge: (edgeId) => set((state) => ({
    edges: state.edges.filter(edge => edge.id !== edgeId)
  })),

  useMnist: false,
  setUseMnist: (value) => set(() => ({ useMnist: value })),

  // 项目相关的状态
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
}));

// 将store实例放到window对象上以便全局访问
if (typeof window !== 'undefined') {
  window.useStore = useStore;
}

export default useStore;



