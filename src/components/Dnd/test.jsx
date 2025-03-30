import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import './dist.css';
import { useDrop } from 'react-dnd';

import UseData from '../UseData';
import Conv2DNode from '../modelAdd/conv2d1';
import MaxPooling2DNode from '../modelAdd/maxPooling2d';
import DenseNode from '../modelAdd/dense';
import TrainButton from '../modelAdd/train';
import useStore from '@/store'; 

const rfStyle = {
  backgroundColor: '#B8CEFF',
  width: '90%',
  height: 'calc(100vh - 64px)', 
};

const initialEdges = [];

const nodeTypes = {
  useData: UseData,
  conv2d: Conv2DNode,
  maxPooling2d: MaxPooling2DNode,
  dense: DenseNode,
  trainButton: TrainButton,
};

function Flow() {
  const { 
    nodes, 
    addNode, 
    removeNode,
    conv2dConfigs,
    maxPooling2dConfigs,
    denseConfig,
    updateConv2dConfig,
    updateMaxPooling2dConfig,
    updateDenseConfig
  } = useStore();

  const [elements, setElements] = useState(nodes.map((node, index) => ({
    id: `${node.type}-${index}`,
    type: node.type,
    data: { index: node.configIndex },
    position: { x: index * 200 + 50, y: 50 },
  })));

  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useRef(null);

  const onConnect = useCallback((params) => setElements((els) => addEdge(params, els)), []);

  const handleAddNode = useCallback((type, position) => {
    let newNode = {};
    if (type === 'conv2d') {
      newNode = {
        id: `conv2d-${nodes.filter(n => n.type === 'conv2d').length}`,
        type: 'conv2d',
        data: { index: conv2dConfigs.length },
        position,
      };
      addNode(type);
    } else if (type === 'maxPooling2d') {
      newNode = {
        id: `maxPooling2d-${nodes.filter(n => n.type === 'maxPooling2d').length}`,
        type: 'maxPooling2d',
        data: { index: maxPooling2dConfigs.length },
        position,
      };
      addNode(type);
    } else if (type === 'dense') {
      newNode = {
        id: `dense`,
        type: 'dense',
        data: { index: 0 }, // Assuming there's only one dense layer configuration
        position,
      };
      addNode(type);
    } else if (type === 'trainButton') {
      newNode = {
        id: `trainButton`,
        type: 'trainButton',
        data: {},
        position,
      };
      addNode(type);
    }
    setElements((els) => [...els, newNode]);
  }, [addNode, conv2dConfigs.length, maxPooling2dConfigs.length]);

  const [{ isOver }, drop] = useDrop({
    accept: ['conv2d', 'maxPooling2d', 'dense', 'trainButton'],
    drop(item, monitor) {
      const delta = monitor.getDifferenceFromInitialOffset();
      const left = Math.round(monitor.getClientOffset().x - delta.x);
      const top = Math.round(monitor.getClientOffset().y - delta.y);
      const elementsCenter = reactFlowInstance.current?.getViewportPosition({ x: left, y: top });
      handleAddNode(item.type, elementsCenter || { x: left, y: top });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  useEffect(() => {
    setElements(nodes.map((node, index) => ({
      id: `${node.type}-${index}`,
      type: node.type,
      data: { index: node.configIndex },
      position: { x: index * 200 + 50, y: 50 },
    })));
  }, [nodes]);

  return (
    <div style={{ width: '100%', height: '700px' }} ref={drop}>
      <ReactFlow
        nodes={elements}
        edges={initialEdges}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        snapToGrid={true}
        snapGrid={[15, 15]}
        ref={reactFlowWrapper}
        onInit={(instance) => (reactFlowInstance.current = instance)}
        onNodesChange={applyNodeChanges}
        onEdgesChange={applyEdgeChanges}
        fitView
        style={rfStyle}
      >
        <Background color="#aaa" gap={16} />
        <Controls />
      </ReactFlow>  
    </div>
   
  );
}

export default Flow;
