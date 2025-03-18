import { create } from 'zustand'

const useStore = create((set) => ({

    isData: false,
    changeData: () => set(() => ({ isData: true })),


    conv2dConfig: {
        kernelSize: 5,
        filters: 16,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
    },
    setKernelSize: (kernelSize) => set((state) => ({
        conv2dConfig: { ...state.conv2dConfig, kernelSize }
    })),
    setFilters: (filters) => set((state) => ({
        conv2dConfig: { ...state.conv2dConfig, filters }
    })),
    setStrides: (strides) => set((state) => ({
        conv2dConfig: { ...state.conv2dConfig, strides }
    })),
    setActivation: (activation) => set((state) => ({
        conv2dConfig: { ...state.conv2dConfig, activation }
    })),
    setKernelInitializer: (kernelInitializer) => set((state) => ({
        conv2dConfig: { ...state.conv2dConfig, kernelInitializer }
    })),


}));

export default useStore;
