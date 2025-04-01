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


    nodes: [],
    addNode: (type, configIndex, id) => set((state) => {
        const defaultPosition = { x: 100, y: 100 };
        let newNode = { 
            id: id || `${type}-${Date.now()}`, 
            type, 
            configIndex, 
            position: defaultPosition 
        };
        
        // 添加对应的配置
        if (type === 'conv2d' && configIndex !== undefined) {
            state.addConv2dConfig();
        } else if (type === 'maxPooling2d' && configIndex !== undefined) {
            state.addMaxPooling2dConfig();
        }
        
        return { nodes: [...state.nodes, newNode] };
    }),
    removeNode: (nodeId) => set((state) => {
        // 找到要删除的节点
        const nodeToRemove = state.nodes.find(node => node.id === nodeId);
        if (!nodeToRemove) return { nodes: state.nodes };
        
        // 从nodes列表中移除节点
        const newNodes = state.nodes.filter(node => node.id !== nodeId);
        
        // 根据节点类型删除对应的配置
        if (nodeToRemove.type === 'conv2d') {
            state.removeConv2dConfig(nodeToRemove.configIndex);
        } else if (nodeToRemove.type === 'maxPooling2d') {
            state.removeMaxPooling2dConfig(nodeToRemove.configIndex);
        }
        
        return { nodes: newNodes };
    }),
    
    // 更新节点位置
    updateNodePosition: (nodeId, position) => set((state) => ({
        nodes: state.nodes.map(node => 
            node.id === nodeId 
                ? { ...node, position } 
                : node
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
    }
}));

export default useStore;


