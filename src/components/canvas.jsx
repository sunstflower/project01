import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import './dist.css';

import UseData from './UseData';
import Conv2DNode from './modelAdd/conv2d1';
import MaxPooling2DNode from './modelAdd/maxPooling2d';

const rfStyle = {
  backgroundColor: '#B8CEFF',
};

const initialNodes = [
  {
    id: 'node-1',
    data: { label: 'Input Data' },
    position: { x: 0, y: 0 },
    type: 'useData',
  },
  {
    id: 'node-2',
    type: 'conv2d',
    targetPosition: 'top',
    position: { x: 0, y: 100 },
    data: { label: 'Conv2D Layer 1', index: 0 },
  },
  {
    id: 'node-3',
    type: 'maxPooling2d',
    targetPosition: 'top',
    position: { x: 0, y: 400 },
    data: { label: 'MaxPooling2D Layer 1', index: 0 },
  },
  {
    id: 'node-4',
    type: 'conv2d',
    targetPosition: 'top',
    position: { x: 200, y: 100 },
    data: { label: 'Conv2D Layer 2', index: 1 },
  },
  {
    id: 'node-5',
    type: 'maxPooling2d',
    targetPosition: 'top',
    position: { x: 200, y: 400 },
    data: { label: 'MaxPooling2D Layer 2', index: 1 },
  },
];

const initialEdges = [
  { id: 'edge-1', source: 'node-1', target: 'node-2', sourceHandle: 'a' },
  { id: 'edge-2', source: 'node-2', target: 'node-3', sourceHandle: 'b' },
  { id: 'edge-3', source: 'node-1', target: 'node-4', sourceHandle: 'a' },
  { id: 'edge-4', source: 'node-4', target: 'node-5', sourceHandle: 'b' },
];

const nodeTypes = {
  useData: UseData,
  conv2d: Conv2DNode,
  maxPooling2d: MaxPooling2DNode,
};

function Flow() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );

  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  return (
    <div style={{ width: '100%', height: '700px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
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



