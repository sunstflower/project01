import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  Panel,
  MiniMap,
  ReactFlowProvider,
} from '@xyflow/react';
import './dist.css';
import { useDrop } from 'react-dnd';
import { Modal, Button, message } from 'antd';
import { generateModelCode, validateModelStructure, generateModelStructureFromGraph } from '@/tfjs/modelGenerator';

import UseData from '../UseData';
import Conv2DNode from '../modelAdd/conv2d1';
import MaxPooling2DNode from '../modelAdd/maxPooling2d';
import DenseNode from '../modelAdd/dense';
import TrainButton from '../modelAdd/train';
import useStore from '@/store'; 

const rfStyle = {
  backgroundColor: '#f8fafc',
  width: '100%',
  height: 'calc(100vh - 64px)', 
};

const father = {
    position: 'relative', 
    height: '100%', 
    width: '100%' 
}

// 自定义边样式
const edgeOptions = {
  animated: true,
  style: {
    stroke: '#3b82f6',
    strokeWidth: 2,
  },
};

// 自定义连接线选项
const connectionLineStyle = {
  stroke: '#3b82f6',
  strokeWidth: 2,
};

// 节点类型映射
const nodeTypes = {
  useData: UseData,
  conv2d: Conv2DNode,
  maxPooling2d: MaxPooling2DNode,
  dense: DenseNode,
  trainButton: TrainButton,
};

// 确定节点的默认尺寸（用于自动连接计算）
const defaultNodeWidth = 260;
const defaultNodeHeight = 200;

// 包装组件，确保ReactFlow上下文正确加载
function FlowWithProvider() {
  return (
    <ReactFlowProvider>
      <FlowComponent />
    </ReactFlowProvider>
  );
}

function FlowComponent() {
  const { 
    nodes, 
    addNode, 
    removeNode,
    updateNodePosition,
    conv2dConfigs,
    maxPooling2dConfigs,
    denseConfig,
  } = useStore();
  
  const [elements, setElements] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  
  // 处理节点之间的连接
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#3b82f6' }
    }, eds));
  }, []);

  // 处理节点变化
  const onNodesChange = useCallback((changes) => {
    // 更新本地状态
    setElements((els) => applyNodeChanges(changes, els));
    
    // 如果是位置变化，更新store中的位置
    changes.forEach(change => {
      if (change.type === 'position' && change.dragging === false) {
        updateNodePosition(change.id, { x: change.position.x, y: change.position.y });
      }
    });
  }, [updateNodePosition]);

  // 处理边变化
  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  // 尝试将新节点自动连接到最后一个合适的节点
  const tryConnectToLastNode = (newNode, elements) => {
    if (elements.length === 0) return [];
    
    // 获取所有非训练按钮的节点，按Y坐标排序
    const sortedNodes = [...elements]
      .filter(node => node.type !== 'trainButton')
      .sort((a, b) => a.position.y - b.position.y);
    
    if (sortedNodes.length === 0) return [];
    
    // 获取最后一个节点作为连接源
    const lastNode = sortedNodes[sortedNodes.length - 1];
    
    // 创建连接
    return [{
      id: `e-${lastNode.id}-${newNode.id}`,
      source: lastNode.id,
      target: newNode.id,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#3b82f6' }
    }];
  };

  // 添加节点的处理函数
  const handleAddNode = useCallback((type, position) => {
    let newNode = {};
    let nodeId = '';
    let configIndex = 0;
    
    // 根据节点类型创建不同的节点
    if (type === 'conv2d') {
      configIndex = conv2dConfigs.length;
      nodeId = `conv2d-${Date.now()}`;
      newNode = {
        id: nodeId,
        type: 'conv2d',
        data: { index: configIndex },
        position,
      };
    } else if (type === 'maxPooling2d') {
      configIndex = maxPooling2dConfigs.length;
      nodeId = `maxPooling2d-${Date.now()}`;
      newNode = {
        id: nodeId,
        type: 'maxPooling2d',
        data: { index: configIndex },
        position,
      };
    } else if (type === 'dense') {
      nodeId = `dense-${Date.now()}`;
      newNode = {
        id: nodeId,
        type: 'dense',
        data: { index: 0 },
        position,
      };
    } else if (type === 'trainButton') {
      nodeId = `trainButton-${Date.now()}`;
      newNode = {
        id: nodeId,
        type: 'trainButton',
        data: {},
        position,
      };
    }
    
    // 添加节点到状态中
    addNode(type, configIndex, nodeId);
    setElements((els) => [...els, newNode]);
    
    // 尝试自动连接到前一个节点
    const newEdges = tryConnectToLastNode(newNode, elements);
    if (newEdges.length > 0) {
      setEdges(edges => [...edges, ...newEdges]);
    }
  }, [addNode, conv2dConfigs.length, maxPooling2dConfigs.length, elements, edges]);

  // 使用ReactDnD处理拖拽
  const [{ isOver }, drop] = useDrop({
    accept: ['conv2d', 'maxPooling2d', 'dense', 'trainButton'],
    drop(item, monitor) {
      if (!reactFlowInstance) return;
      
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = monitor.getClientOffset();
      
      // 计算拖拽放置的位置（直接使用相对于ReactFlow容器的位置）
      // 这种方法不考虑缩放或平移，但作为基本功能能够工作
      const flowX = position.x - reactFlowBounds.left;
      const flowY = position.y - reactFlowBounds.top;
      
      // 添加新节点到指定位置
      handleAddNode(item.type, { x: flowX, y: flowY });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  // 处理节点删除
  const onNodeDelete = useCallback((nodes) => {
    nodes.forEach(node => {
      removeNode(node.id);
    });
  }, [removeNode]);

  // 生成TensorFlow.js代码
  const generateCode = useCallback(() => {
    // 验证模型结构
    const validation = validateModelStructure(elements, edges);
    if (!validation.valid) {
      message.error(validation.message);
      return;
    }
    
    // 从图生成有序的模型结构
    const modelStructure = generateModelStructureFromGraph(elements, edges);
    
    // 从配置中填充具体的配置参数
    const detailedStructure = modelStructure.map(node => {
      let config = {};
      
      if (node.type === 'conv2d') {
        const index = node.config.index;
        config = conv2dConfigs[index] || {};
      } else if (node.type === 'maxPooling2d') {
        const index = node.config.index;
        config = maxPooling2dConfigs[index] || {};
      } else if (node.type === 'dense') {
        config = denseConfig;
      }
      
      return {
        type: node.type,
        config
      };
    });
    
    // 生成代码
    const code = generateModelCode(detailedStructure);
    setGeneratedCode(code);
    setIsModalVisible(true);
  }, [elements, edges, conv2dConfigs, maxPooling2dConfigs, denseConfig]);

  // 复制代码到剪贴板
  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(generatedCode).then(() => {
      message.success('代码已复制到剪贴板');
    }, () => {
      message.error('复制失败，请手动复制');
    });
  };

  // 初始化节点
  useEffect(() => {
    if (nodes.length > 0 && elements.length === 0) {
      const initialNodes = nodes.map((node) => ({
        id: node.id,
        type: node.type,
        data: { index: node.configIndex },
        position: node.position || { x: 100, y: 100 },
      }));
      setElements(initialNodes);
    }
  }, [nodes, elements.length]);

  return (
    <div style={father} ref={reactFlowWrapper}>
      <ReactFlow
        ref={drop}
        nodes={elements}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodeDelete}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={edgeOptions}
        connectionLineStyle={connectionLineStyle}
        snapToGrid={true}
        snapGrid={[15, 15]}
        onInit={setReactFlowInstance}
        fitView
        style={rfStyle}
        deleteKeyCode="Delete"
      >
        <Background color="#94a3b8" gap={16} variant="dots" />
        <MiniMap 
          nodeStrokeColor={(n) => {
            if (n.type === 'conv2d') return '#3b82f6';
            if (n.type === 'maxPooling2d') return '#10b981';
            if (n.type === 'dense') return '#8b5cf6';
            if (n.type === 'trainButton') return '#ef4444';
            return '#6b7280';
          }}
          nodeColor={(n) => {
            if (n.type === 'conv2d') return '#93c5fd';
            if (n.type === 'maxPooling2d') return '#a7f3d0';
            if (n.type === 'dense') return '#c4b5fd';
            if (n.type === 'trainButton') return '#fca5a5';
            return '#d1d5db';
          }}
        />
        <Controls />
        <Panel position="top-right">
          <div className="bg-white p-3 rounded shadow">
            <h3 className="text-sm font-bold">拖拽节点到画布构建模型</h3>
          </div>
        </Panel>
        <Panel position="bottom-center">
          <Button 
            type="primary" 
            onClick={generateCode}
            size="large"
            style={{
              background: '#3b82f6',
              borderColor: '#3b82f6',
              marginBottom: '20px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          >
            生成TensorFlow.js代码
          </Button>
        </Panel>
      </ReactFlow>
      
      <Modal
        title="生成的TensorFlow.js模型代码"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        footer={[
          <Button key="copy" type="primary" onClick={copyCodeToClipboard}>
            复制代码
          </Button>,
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <pre style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '5px',
          maxHeight: '500px',
          overflow: 'auto' 
        }}>
          {generatedCode}
        </pre>
      </Modal>
    </div>
  );
}

export default FlowWithProvider;



