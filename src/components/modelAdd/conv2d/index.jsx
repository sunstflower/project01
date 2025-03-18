import React, { useCallback, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '@/store';

function Conv2DNode() {
    const [kernelSize, setKernelSize] = useState(5);
    const [filters, setFilters] = useState(16);
    const [strides, setStrides] = useState(1);
    const [activation, setActivation] = useState('relu');
    const [kernelInitializer, setKernelInitializer] = useState('varianceScaling');
    const handleKernelSizeChange = (e) => setKernelSize(e.target.value);
    const handleFiltersChange = (e) => setFilters(e.target.value);
    const handleStridesChange = (e) => setStrides(e.target.value);
    const handleActivationChange = (e) => setActivation(e.target.value);
    const handleKernelInitializerChange = (e) => setKernelInitializer(e.target.value);

    return (
        <div className="text-updater-node">
            <Handle
                type="target"
                position={Position.Top}
            />
            <div>
                <label htmlFor="kernelSizeInput">Kernel Size:</label>
                <input 
                    id="kernelSizeInput" 
                    name="kernelSize" 
                    type="number" 
                    value={kernelSize} 
                    onChange={handleKernelSizeChange} 
                    className="nodrag"
                />
                
                <label htmlFor="filtersInput">Filters:</label>
                <input 
                    id="filtersInput" 
                    name="filters" 
                    type="number" 
                    value={filters} 
                    onChange={handleFiltersChange} 
                    className="nodrag"
                />
                
                <label htmlFor="stridesInput">Strides:</label>
                <input 
                    id="stridesInput" 
                    name="strides" 
                    type="number" 
                    value={strides} 
                    onChange={handleStridesChange} 
                    className="nodrag"
                />

                <label htmlFor="activationSelect">Activation:</label>
                <select 
                    id="activationSelect" 
                    name="activation" 
                    value={activation} 
                    onChange={handleActivationChange} 
                    className="nodrag"
                >
                    <option value="relu">ReLU</option>
                    <option value="sigmoid">Sigmoid</option>
                    <option value="softmax">Softmax</option>
                </select>

                <label htmlFor="kernelInitializerSelect">Kernel Initializer:</label>
                <select 
                    id="kernelInitializerSelect" 
                    name="kernelInitializer" 
                    value={kernelInitializer} 
                    onChange={handleKernelInitializerChange} 
                    className="nodrag"
                >
                    <option value="varianceScaling">Variance Scaling</option>
                </select>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                id="a"
            />
        </div>
    );
}

export default Conv2DNode;



