import { useState, useCallback } from 'react';
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
import Conv2DNode from './modelAdd/conv2d'
import maxPooling2d from './modelAdd/maxPooling2d';
 
const rfStyle = {
    backgroundColor: '#B8CEFF',
  };

const initialNodes = [
  {
    id: 'node-1',
    data: { label: '123' },
    position: { x: 0, y: 0 },
    type: 'useData',
  },
  {
    id: 'node-2',
    type: 'conv2d',
    targetPosition: 'top',
    position: { x: 0, y: 100 },
    data: { label: 'node 2' },
  },
  {
    id: 'node-3',
    type: 'maxPooling2d',
    targetPosition: 'top',
    position: { x: 0, y: 700 },
    data: { label: 'node 3' },
  }
];
 
const initialEdges = [
    { id: 'edge-1', source: 'node-1', target: 'node-2', sourceHandle: 'a' },
    { id: 'edge-2', source: 'node-2', target: 'node-3', sourceHandle: 'b' },
];
 
const nodeTypes = { useData: UseData, conv2d:Conv2DNode, maxPooling2d: maxPooling2d };
 
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
    <div style={{ width: '100%', height: '500px' }}>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      style={rfStyle}
    />
    </div>
  );
}
 
export default Flow;