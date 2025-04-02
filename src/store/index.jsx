import { create } from 'zustand';

const useStore = create((set) => ({
  isData: false,
  changeData: (data) => set(() => ({ isData: true, csvData: data })),

  csvData: [],
  addCsvData: (config) => set((state) => ({
    csvData: [...state.csvData, config]
  })),

  conv2dConfigs: [
    {
      kernelSize: 5,
      filters: 8,
      strides: 1,
      activation: 'relu',
      kernelInitializer: 'varianceScaling',
    },
    {
      kernelSize: 5,
      filters: 16,
      strides: 1,
      activation: 'relu',
      kernelInitializer: 'varianceScaling',
    }
  ],
  addConv2dConfig: () => set((state) => ({
    conv2dConfigs: [...state.conv2dConfigs, {
      kernelSize: 5,
      filters: 8,
      strides: 1,
      activation: 'relu',
      kernelInitializer: 'varianceScaling',
    }]
  })),
  updateConv2dConfig: (index, config) => set((state) => ({
    conv2dConfigs: state.conv2dConfigs.map((c, i) => (i === index ? { ...c, ...config } : c))
  })),
  removeConv2dConfig: (index) => set((state) => ({
    conv2dConfigs: state.conv2dConfigs.filter((_, i) => i !== index)
  })),

  maxPooling2dConfigs: [
    {
      poolSize: [3, 3],
      strides: [3, 3],
    },
    {
      poolSize: [2, 2],
      strides: [2, 2],
    }
  ],
  addMaxPooling2dConfig: () => set((state) => ({
    maxPooling2dConfigs: [...state.maxPooling2dConfigs, {
      poolSize: [3, 3],
      strides: [3, 3],
    }]
  })),
  updateMaxPooling2dConfig: (index, config) => set((state) => ({
    maxPooling2dConfigs: state.maxPooling2dConfigs.map((c, i) => (i === index ? { ...c, ...config } : c))
  })),
  removeMaxPooling2dConfig: (index) => set((state) => ({
    maxPooling2dConfigs: state.maxPooling2dConfigs.filter((_, i) => i !== index)
  })),

  denseConfig: {
    units: 10,
    kernelInitializer: 'varianceScaling',
    activation: 'softmax'
  },
  updateDenseConfig: (config) => set((state) => ({
    denseConfig: {...state.denseConfig, ...config}
  })),

  // 添加连接验证函数
  isValidConnection: (sourceType, targetType) => {
    // 数据源只能连接到卷积层
    if (sourceType === 'useData' || sourceType === 'mnist') {
      return targetType === 'conv2d';
    }
    
    // 卷积层只能连接到池化层
    if (sourceType === 'conv2d') {
      return targetType === 'maxPooling2d';
    }
    
    // 池化层可以连接到卷积层或全连接层
    if (sourceType === 'maxPooling2d') {
      return targetType === 'conv2d' || targetType === 'dense';
    }
    
    // 全连接层只能连接到其他全连接层
    if (sourceType === 'dense') {
      return targetType === 'dense';
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
      state.addConv2dConfig();
    } else if (type === 'maxPooling2d' && configIndex !== undefined) {
      state.addMaxPooling2dConfig();
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
      state.removeConv2dConfig(nodeToRemove.configIndex);
    } else if (nodeToRemove.type === 'maxPooling2d' && nodeToRemove.configIndex !== undefined) {
      state.removeMaxPooling2dConfig(nodeToRemove.configIndex);
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
          config: state.conv2dConfigs[node.configIndex]
        };
      } else if (node.type === 'maxPooling2d') {
        return {
          type: 'maxPooling2d',
          config: state.maxPooling2dConfigs[node.configIndex]
        };
      } else if (node.type === 'dense') {
        return {
          type: 'dense',
          config: state.denseConfig
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
      target 
    }]
  })),
  removeEdge: (edgeId) => set((state) => ({
    edges: state.edges.filter(edge => edge.id !== edgeId)
  })),

  useMnist: false,
  setUseMnist: (value) => set(() => ({ useMnist: value })),
}));

export default useStore;



