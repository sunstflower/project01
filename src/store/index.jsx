import { create } from 'zustand';

const useStore = create((set) => ({
    isData: false,
    changeData: () => set(() => ({ isData: true })),

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
    addConv2dConfig: (config) => set((state) => ({
        conv2dConfigs: [...state.conv2dConfigs, config]
    })),
    updateConv2dConfig: (index, config) => set((state) => ({
        conv2dConfigs: state.conv2dConfigs.map((c, i) => (i === index ? { ...c, ...config } : c))
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
    addMaxPooling2dConfig: (config) => set((state) => ({
        maxPooling2dConfigs: [...state.maxPooling2dConfigs, config]
    })),
    updateMaxPooling2dConfig: (index, config) => set((state) => ({
        maxPooling2dConfigs: state.maxPooling2dConfigs.map((c, i) => (i === index ? { ...c, ...config } : c))
    })),
}));

export default useStore;



