import { create } from 'zustand'

const useDataStore = create((set) => ({
    isData: false,
    changeData: () => set((state) => ({ isData: true }))
}))

export default useDataStore;