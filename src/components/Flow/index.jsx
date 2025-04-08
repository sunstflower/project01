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
import MnistData from '../modelAdd/mnist';
import Conv2DNode from '../modelAdd/conv2d1';
import MaxPooling2DNode from '../modelAdd/maxPooling2d';
import DenseNode from '../modelAdd/dense';
import TrainButton from '../modelAdd/train';
import DropoutNode from '../modelAdd/dropout';
import BatchNormNode from '../modelAdd/batchNorm';
import FlattenNode from '../modelAdd/flatten';
import LSTMNode from '../modelAdd/lstm';
import useStore from '@/store'; 

// Apple风格的样式
const rfStyle = {
  backgroundColor: '#f5f5f7',
  width: '100%', 
  height: '100%', 
};

const father = {
    position: 'relative', 
    height: '100%', 
    width: '100%' 
}

// 自定义边样式 - Apple风格
const edgeOptions = {
  animated: true,
  style: {
    stroke: '#007aff',
    strokeWidth: 2,
  },
};

// 自定义连接线选项 - Apple风格
const connectionLineStyle = {
  stroke: '#007aff',
  strokeWidth: 2,
};

// 节点类型映射
const nodeTypes = {
  useData: UseData,
  mnist: MnistData,
  conv2d: Conv2DNode,
  maxPooling2d: MaxPooling2DNode,
  dense: DenseNode,
  trainButton: TrainButton,
  dropout: DropoutNode,
  batchNorm: BatchNormNode,
  flatten: FlattenNode,
  lstm: LSTMNode,
};

// 允许连接的节点类型组合
const isValidConnection = (sourceType, targetType) => {
  // 数据源只能连接到处理层
  if (sourceType === 'useData' || sourceType === 'mnist') {
    return ['conv2d', 'dense', 'flatten', 'lstm'].includes(targetType);
  }
  
  // 大多数层可以连接到任何其他处理层
  const processingLayers = ['conv2d', 'maxPooling2d', 'dense', 'dropout', 'batchNorm', 'flatten', 'lstm'];
  if (processingLayers.includes(sourceType)) {
    return processingLayers.includes(targetType);
  }
  
  return false;
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
    // 找到源节点和目标节点
    const sourceNode = elements.find(node => node.id === params.source);
    const targetNode = elements.find(node => node.id === params.target);
    
    // 如果找不到节点，不执行连接
    if (!sourceNode || !targetNode) return;
    
    // 验证连接是否有效
    if (!isValidConnection(sourceNode.type, targetNode.type)) {
      message.error(`Cannot connect ${sourceNode.type} to ${targetNode.type}`);
      return;
    }
    
    // 执行连接
    setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#007aff' }
    }, eds));
    
  }, [elements]);

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
    
    // 按照添加顺序获取节点
    const orderedNodes = [...elements].sort((a, b) => {
      // 解析节点id中的时间戳（假设格式为 type-timestamp）
      const aTimestamp = parseInt(a.id.split('-')[1]) || 0;
      const bTimestamp = parseInt(b.id.split('-')[1]) || 0;
      return bTimestamp - aTimestamp;  // 最新添加的优先
    });
    
    // 找到最后添加的可能与新节点连接的节点
    for (const lastNode of orderedNodes) {
      if (isValidConnection(lastNode.type, newNode.type)) {
        // 创建连接
        return [{
          id: `e-${lastNode.id}-${newNode.id}`,
          source: lastNode.id,
          target: newNode.id,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#007aff' }
        }];
      }
    }
    
    return [];
  };

  // 添加节点的处理函数
  const handleAddNode = useCallback((type, position) => {
    let newNode = {};
    let nodeId = '';
    let configIndex = 0;
    const currentTimestamp = Date.now();
    
    // 获取当前节点数量作为序列ID
    const sequenceId = elements.length;
    
    // 根据节点类型创建不同的节点
    if (type === 'conv2d') {
      configIndex = conv2dConfigs.length;
      nodeId = `conv2d-${currentTimestamp}`;
      newNode = {
        id: nodeId,
        type: 'conv2d',
        data: { 
          index: configIndex,
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'maxPooling2d') {
      configIndex = maxPooling2dConfigs.length;
      nodeId = `maxPooling2d-${currentTimestamp}`;
      newNode = {
        id: nodeId,
        type: 'maxPooling2d',
        data: { 
          index: configIndex,
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'dense') {
      nodeId = `dense-${currentTimestamp}`;
      newNode = {
        id: nodeId,
        type: 'dense',
        data: { 
          index: 0,
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'trainButton') {
      nodeId = `trainButton-${currentTimestamp}`;
      newNode = {
        id: nodeId,
        type: 'trainButton',
        data: { 
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'useData') {
      nodeId = `useData-${currentTimestamp}`;
      newNode = {
        id: nodeId,
        type: 'useData',
        data: { 
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'mnist') {
      nodeId = `mnist-${currentTimestamp}`;
      newNode = {
        id: nodeId,
        type: 'mnist',
        data: { 
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'dropout') {
      nodeId = `dropout-${currentTimestamp}`;
      newNode = {
        id: nodeId,
        type: 'dropout',
        data: { 
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'batchNorm') {
      nodeId = `batchNorm-${currentTimestamp}`;
      newNode = {
        id: nodeId,
        type: 'batchNorm',
        data: { 
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'flatten') {
      nodeId = `flatten-${currentTimestamp}`;
      newNode = {
        id: nodeId,
        type: 'flatten',
        data: { 
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'lstm') {
      nodeId = `lstm-${currentTimestamp}`;
      newNode = {
        id: nodeId,
        type: 'lstm',
        data: { 
          sequenceId: sequenceId 
        },
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
    accept: ['conv2d', 'maxPooling2d', 'dense', 'trainButton', 'useData', 'mnist', 'dropout', 'batchNorm', 'flatten', 'lstm'],
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
    
    // 生成代码，传入edges参数
    const code = generateModelCode(detailedStructure, edges);
    setGeneratedCode(code);
    setIsModalVisible(true);
  }, [elements, edges, conv2dConfigs, maxPooling2dConfigs, denseConfig]);

  // 复制代码到剪贴板
  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(generatedCode).then(() => {
      message.success('Code copied to clipboard');
    }, () => {
      message.error('Failed to copy, please manually copy the code');
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
        <Background color="#d1d1d6" gap={16} variant="dots" />
        <MiniMap 
          nodeStrokeColor={(n) => {
            if (n.type === 'useData' || n.type === 'mnist') return '#32d74b';
            if (n.type === 'conv2d') return '#007aff';
            if (n.type === 'maxPooling2d') return '#5856d6';
            if (n.type === 'dense') return '#ff9f0a';
            if (n.type === 'trainButton') return '#ff3b30';
            return '#8e8e93';
          }}
          nodeColor={(n) => {
            if (n.type === 'useData' || n.type === 'mnist') return '#a7f3d0';
            if (n.type === 'conv2d') return '#93c5fd';
            if (n.type === 'maxPooling2d') return '#c7d2fe';
            if (n.type === 'dense') return '#fed7aa';
            if (n.type === 'trainButton') return '#fca5a5';
            return '#d1d5db';
          }}
        />
        <Controls />
        <Panel position="top-right">
          <div className="bg-white p-3 rounded-xl shadow">
            <h3 className="text-sm font-medium text-gray-800">Drag & Drop Components</h3>
          </div>
        </Panel>
        <Panel position="bottom-center">
          <Button 
            type="primary" 
            onClick={generateCode}
            size="large"
            style={{
              background: '#007aff',
              borderColor: '#007aff',
              marginBottom: '20px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              borderRadius: '12px',
              paddingLeft: '16px',
              paddingRight: '16px',
            }}
          >
            Generate TensorFlow.js Code
          </Button>
        </Panel>
      </ReactFlow>
      
      <Modal
        title="Generated TensorFlow.js Model Code"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        footer={[
          <Button key="copy" type="primary" onClick={copyCodeToClipboard}
            style={{
              background: '#007aff',
              borderColor: '#007aff',
            }}
          >
            Copy Code
          </Button>,
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        <pre style={{ 
          background: '#f5f5f7', 
          padding: '15px', 
          borderRadius: '10px',
          maxHeight: '500px',
          overflow: 'auto',
          fontFamily: 'SF Mono, Menlo, monospace',
        }}>
          {generatedCode}
        </pre>
      </Modal>
    </div>
  );
}

export default FlowWithProvider;


