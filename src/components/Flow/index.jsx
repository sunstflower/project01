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
import { generateModelCode, validateModelStructure, generateModelStructureFromGraph, generateLayerTooltip } from '@/tfjs/modelGenerator';
import { validateConnection, calculateModelShapes, getLayerShapeDescription, getLayerDescription } from '@/utils/layerValidation';
import LayerTooltip from '../Tooltip/LayerTooltip';

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
import ActivationNode from '../modelAdd/activation';
import AvgPooling2DNode from '../modelAdd/avgPooling2d';
import GRUNode from '../modelAdd/gru';
import ReshapeNode from '../modelAdd/reshape';
import useStore from '@/store'; 

// 现代风格的样式
const rfStyle = {
  backgroundColor: '#f5f5f7',
  width: '100%', 
  height: '90vh', // 增加高度到90vh
};

const father = {
    position: 'relative', 
    height: '90vh', // 增加高度到90vh
    width: '100%',
    minHeight: '700px',
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
  mnist: MnistData,
  conv2d: Conv2DNode,
  maxPooling2d: MaxPooling2DNode,
  dense: DenseNode,
  trainButton: TrainButton,
  dropout: DropoutNode,
  batchNorm: BatchNormNode,
  flatten: FlattenNode,
  lstm: LSTMNode,
  activation: ActivationNode,
  avgPooling2d: AvgPooling2DNode,
  gru: GRUNode,
  reshape: ReshapeNode,
};

// 允许连接的节点类型组合
const isValidConnection = (sourceType, targetType) => {
  // 数据源只能连接到处理层
  if (sourceType === 'useData' || sourceType === 'mnist') {
    return ['conv2d', 'dense', 'flatten', 'lstm', 'gru', 'reshape'].includes(targetType);
  }
  
  // 大多数层可以连接到任何其他处理层
  const processingLayers = ['conv2d', 'maxPooling2d', 'avgPooling2d', 'dense', 'dropout', 'batchNorm', 'flatten', 'lstm', 'gru', 'activation', 'reshape'];
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
    denseConfigs,
    reshapeConfigs,
    lstmConfigs,
    gruConfigs,
    activationConfigs,
    avgPooling2dConfigs,
    dropoutConfigs,
    batchNormConfigs,
    flattenConfigs,
    updateDenseConfig,
  } = useStore();
  
  const [elements, setElements] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  
  // 添加TensorBoard启动状态
  const [tensorboardStatus, setTensorboardStatus] = useState('idle'); // 'idle', 'loading', 'ready', 'error'
  
  // 添加悬浮提示状态
  const [tooltipInfo, setTooltipInfo] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  
  // 处理节点之间的连接
  const onConnect = useCallback((params) => {
    // 找到源节点和目标节点
    const sourceNode = elements.find(node => node.id === params.source);
    const targetNode = elements.find(node => node.id === params.target);
    
    // 如果找不到节点，不执行连接
    if (!sourceNode || !targetNode) return;
    
    // 验证连接是否有效
    if (!isValidConnection(sourceNode.type, targetNode.type)) {
      alert(`无法连接 ${sourceNode.type} 到 ${targetNode.type}，层类型不兼容`);
      return;
    }
    
    // 计算模型中所有节点的形状
    const allNodes = [...elements, targetNode];
    const allEdges = [...edges, { source: sourceNode.id, target: targetNode.id }];
    const shapeMap = calculateModelShapes(allNodes, allEdges);
    
    // 检查目标节点是否有形状错误
    if (shapeMap[targetNode.id]?.error) {
      const errorMsg = shapeMap[targetNode.id].error;
      alert(`形状不兼容: ${errorMsg}`);
      console.warn('形状兼容性问题:', shapeMap[targetNode.id]);
      
      // 如果检测到需要添加Flatten层
      if (shapeMap[targetNode.id].needsFlatten) {
        const addFlattenConfirm = window.confirm(
          `Dense层需要2D输入，但前一层输出为高维张量。\n` +
          `是否自动添加Flatten层解决兼容性问题？`
        );
        
        if (addFlattenConfirm) {
          // 自动添加Flatten层
          const flattenTimestamp = Date.now();
          const flattenId = `flatten-${flattenTimestamp}`;
          
          // 创建Flatten节点
          const flattenNode = {
            id: flattenId,
            type: 'flatten',
            data: { 
              index: flattenConfigs.length, 
              sequenceId: elements.length
            },
            position: {
              x: (sourceNode.position.x + targetNode.position.x) / 2,
              y: (sourceNode.position.y + targetNode.position.y) / 2 - 50
            }
          };
          
          // 添加Flatten层节点
          setElements(els => [...els, flattenNode]);
          
          // 创建从源节点到Flatten的连接
          setEdges(eds => [
            ...eds, 
            {
              id: `e-${sourceNode.id}-${flattenId}`,
              source: sourceNode.id,
              target: flattenId,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#3b82f6' }
            }
          ]);
          
          // 创建从Flatten到目标节点的连接
          setTimeout(() => {
            setEdges(eds => [
              ...eds, 
              {
                id: `e-${flattenId}-${targetNode.id}`,
                source: flattenId,
                target: targetNode.id,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#3b82f6' }
              }
            ]);
          }, 100);
          
          return;
        }
      }
      return;
    }
    
    // 执行连接
    setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#3b82f6' }
    }, eds));
    
    // 检测并标记输出层
    setTimeout(() => {
      markOutputLayer();
    }, 100);
    
  }, [elements, edges, flattenConfigs]);

  // 标记输出层
  const markOutputLayer = useCallback(() => {
    // 找出所有Dense节点
    const denseNodes = elements.filter(node => node.type === 'dense');
    if (denseNodes.length === 0) return;
    
    // 找出没有出边的节点
    const nodesWithoutOutEdges = elements.filter(node => {
      return !edges.some(edge => edge.source === node.id);
    });
    
    // 找出最后一个Dense节点（没有出边的Dense节点）
    const outputDenseNodes = denseNodes.filter(node => 
      nodesWithoutOutEdges.some(n => n.id === node.id)
    );
    
    if (outputDenseNodes.length > 0) {
      // 对每个找到的输出层Dense节点设置isOutput标志
      outputDenseNodes.forEach(outputNode => {
        const index = outputNode.data?.index || 0;
        // 确保这个节点的Dense配置有正确的单位数（通常为输出类别数量）
        // 对于分类任务，通常是10（数字识别）或根据任务需要设置
        if (!denseConfigs[index] || !denseConfigs[index].units) {
          updateDenseConfig(index, { 
            units: 10,
            activation: 'softmax',
            kernelInitializer: 'varianceScaling',
            isOutput: true
          });
          console.log(`标记Dense节点 ${outputNode.id} 为输出层，并设置默认单位为10`);
        }
      });
    }
  }, [elements, edges, denseConfigs, updateDenseConfig]);

  // 在元素变化后标记输出层
  useEffect(() => {
    markOutputLayer();
  }, [markOutputLayer, elements.length, edges.length]);

  // 获取节点配置的辅助函数
  const getNodeConfig = useCallback((node) => {
    const { type, data } = node;
    const index = data?.index || 0;
    let config = { ...data };
    
    switch (type) {
      case 'conv2d':
        config = { ...config, ...conv2dConfigs[index] };
        break;
      case 'maxPooling2d':
        config = { ...config, ...maxPooling2dConfigs[index] };
        break;
      case 'dense':
        config = { ...config, ...denseConfigs[index] };
        break;
      // 其他层类型...
    }
    
    return config;
  }, [conv2dConfigs, maxPooling2dConfigs, denseConfigs]);

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
          style: { stroke: '#3b82f6' }
        }];
      }
    }
    
    return [];
  };

  // 处理节点删除
  const onNodeDelete = useCallback((nodes) => {
    nodes.forEach(node => {
      removeNode(node.id);
    });
  }, [removeNode]);

  // 生成TensorFlow.js代码
  const generateCode = useCallback(() => {
    console.log('生成代码 - 当前节点:', elements);
    console.log('生成代码 - 当前连接:', edges);
    
    // 先验证模型结构
    const validationResult = validateModelStructure(elements, edges);
    console.log('验证结果:', validationResult);
    
    if (!validationResult.valid) {
      alert(`模型验证失败: ${validationResult.message}`);
      return;
    }
    
    // 在验证通过后才执行代码生成
    // 收集模型结构数据
    const finalStructure = [];
    
    // 保证全局变量可获取到当前Store
    if (typeof window !== 'undefined') {
      window.useStore = useStore;
    }
    
    // 遍历节点
    elements.forEach(node => {
      if (node.type === 'mnist' || node.type === 'useData') {
        // 添加数据源节点
        finalStructure.push({
          type: node.type,
          config: { sequenceId: node.data?.sequenceId || 0 }
        });
      } else if (node.type === 'conv2d') {
        const index = node.data?.index || 0;
        finalStructure.push({
          type: 'conv2d',
          config: { 
            ...node.data,
            ...conv2dConfigs[index] 
          }
        });
      } else if (node.type === 'maxPooling2d') {
        const index = node.data?.index || 0;
        finalStructure.push({
          type: 'maxPooling2d',
          config: { 
            ...node.data,
            ...maxPooling2dConfigs[index] 
          }
        });
      } else if (node.type === 'dense') {
        const index = node.data?.index || 0;
        finalStructure.push({
          type: 'dense',
          config: { 
            ...node.data,
            ...denseConfigs[index] 
          }
        });
      } else if (node.type === 'dropout') {
        const index = node.data?.index || 0;
        finalStructure.push({
          type: 'dropout',
          config: { 
            ...node.data,
            ...dropoutConfigs[index] 
          }
        });
      } else if (node.type === 'batchNorm') {
        const index = node.data?.index || 0;
        finalStructure.push({
          type: 'batchNorm',
          config: { 
            ...node.data,
            ...batchNormConfigs[index] 
          }
        });
      } else if (node.type === 'flatten') {
        const index = node.data?.index || 0;
        finalStructure.push({
          type: 'flatten',
          config: { 
            ...node.data,
            ...flattenConfigs[index] 
          }
        });
      } else if (node.type === 'activation') {
        const index = node.data?.index || 0;
        finalStructure.push({
          type: 'activation',
          config: { 
            ...node.data,
            ...activationConfigs[index] 
          }
        });
      } else if (node.type === 'avgPooling2d') {
        const index = node.data?.index || 0;
        finalStructure.push({
          type: 'avgPooling2d',
          config: { 
            ...node.data,
            ...avgPooling2dConfigs[index] 
          }
        });
      } else if (node.type === 'lstm') {
        const index = node.data?.index || 0;
        finalStructure.push({
          type: 'lstm',
          config: { 
            ...node.data,
            ...lstmConfigs[index] 
          }
        });
      } else if (node.type === 'gru') {
        const index = node.data?.index || 0;
        finalStructure.push({
          type: 'gru',
          config: { 
            ...node.data,
            ...gruConfigs[index] 
          }
        });
      } else if (node.type === 'reshape') {
        const index = node.data?.index || 0;
        finalStructure.push({
          type: 'reshape',
          config: { 
            ...node.data,
            ...reshapeConfigs[index] 
          }
        });
      }
    });
    
    // 生成代码，传入edges参数
    const code = generateModelCode(finalStructure, edges);
    setGeneratedCode(code);
    setIsModalVisible(true);
  }, [elements, edges, conv2dConfigs, maxPooling2dConfigs, denseConfigs, reshapeConfigs, lstmConfigs, gruConfigs, activationConfigs, avgPooling2dConfigs, dropoutConfigs, batchNormConfigs, flattenConfigs]);

  // 复制代码到剪贴板
  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(generatedCode).then(() => {
      alert('Code copied to clipboard');
    }, () => {
      alert('Failed to copy, please manually copy the code');
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
      configIndex = denseConfigs.length;
      nodeId = `dense-${currentTimestamp}`;
      newNode = {
        id: nodeId,
        type: 'dense',
        data: { 
          index: configIndex,
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
    } else if (type === 'activation') {
      nodeId = `activation-${currentTimestamp}`;
      newNode = {
        id: nodeId,
        type: 'activation',
        data: { 
          index: 0,
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'avgPooling2d') {
      nodeId = `avgPooling2d-${currentTimestamp}`;
      newNode = {
        id: nodeId,
        type: 'avgPooling2d',
        data: { 
          index: 0,
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'gru') {
      nodeId = `gru-${currentTimestamp}`;
      newNode = {
        id: nodeId,
        type: 'gru',
        data: { 
          index: 0,
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'reshape') {
      nodeId = `reshape-${currentTimestamp}`;
      newNode = {
        id: nodeId,
        type: 'reshape',
        data: { 
          index: 0,
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
  }, [addNode, conv2dConfigs.length, maxPooling2dConfigs.length, denseConfigs.length, elements, edges]);

  // 使用ReactDnD处理拖拽
  const [{ isOver }, drop] = useDrop({
    accept: ['conv2d', 'maxPooling2d', 'dense', 'trainButton', 'useData', 'mnist', 'dropout', 'batchNorm', 'flatten', 'lstm', 'activation', 'avgPooling2d', 'gru', 'reshape'],
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

  // 处理打开TensorBoard
  const openTensorboard = useCallback(async () => {
    try {
      setTensorboardStatus('loading');
      
      // 直接提示用户使用TensorBoard
      alert('请按照以下步骤操作：\n\n1. 确保Python环境已安装TensorFlow和TensorBoard\n2. 运行命令: python -m tensorboard.main --logdir=./logs\n3. 在浏览器中打开 http://localhost:6006 查看TensorBoard');
      
      // 自动打开TensorBoard URL
      window.open('http://localhost:6006', '_blank');
      
      setTensorboardStatus('ready');
    } catch (error) {
      console.error('TensorBoard操作错误:', error);
      setTensorboardStatus('error');
    }
  }, []);

  // 生成节点的悬浮提示信息
  const handleNodeHover = useCallback((event, node) => {
    if (!node) {
      setShowTooltip(false);
      return;
    }

    // 计算所有节点的形状
    const shapeMap = calculateModelShapes(elements, edges);
    const nodeShapeInfo = shapeMap[node.id];
    
    // 准备节点配置
    let config;
    switch (node.type) {
      case 'conv2d':
        config = conv2dConfigs[node.data.index];
        break;
      case 'maxPooling2d':
        config = maxPooling2dConfigs[node.data.index];
        break;
      case 'dense':
        config = denseConfigs[node.data.index];
        break;
      case 'lstm':
        config = lstmConfigs[node.data.index];
        break;
      case 'gru':
        config = gruConfigs[node.data.index]; 
        break;
      case 'activation':
        config = activationConfigs[node.data.index];
        break;
      case 'avgPooling2d':
        config = avgPooling2dConfigs[node.data.index];
        break;
      case 'dropout':
        config = dropoutConfigs[node.data.index];
        break;
      case 'batchNorm':
        config = batchNormConfigs[node.data.index];
        break;
      case 'flatten':
        config = flattenConfigs[node.data.index];
        break;
      case 'reshape':
        config = reshapeConfigs[node.data.index];
        break;
      default:
        config = {};
    }
    
    // 构建参数列表
    const params = [];
    if (config) {
      Object.entries(config).forEach(([key, value]) => {
        // 排除一些不需要显示的字段
        if (key !== 'index' && key !== 'sequenceId') {
          params.push({ name: key, value: JSON.stringify(value) });
        }
      });
    }

    // 形状信息
    let inputShape = "未知";
    let outputShape = "未知";
    
    if (nodeShapeInfo) {
      if (nodeShapeInfo.inputShape) {
        inputShape = nodeShapeInfo.inputShape.description;
      }
      if (nodeShapeInfo.outputShape) {
        outputShape = nodeShapeInfo.outputShape.description;
      }
      if (nodeShapeInfo.error) {
        outputShape = `错误: ${nodeShapeInfo.error}`;
      }
    }

    // 设置提示信息
    setTooltipInfo({
      name: getLayerDescription(node.type),
      description: `${node.type} 节点`,
      params,
      inputShape,
      outputShape
    });
    
    // 设置提示位置
    const rect = event.target.getBoundingClientRect();
    setTooltipPosition({
      x: rect.right - (rect.right - rect.left) / 2,
      y: rect.top + rect.height / 2
    });
    
    setShowTooltip(true);
  }, [elements, edges, conv2dConfigs, maxPooling2dConfigs, denseConfigs, lstmConfigs, gruConfigs, activationConfigs, avgPooling2dConfigs, dropoutConfigs, batchNormConfigs, flattenConfigs, reshapeConfigs]);

  return (
    <div className="relative w-full h-[90vh] min-h-[700px]" ref={reactFlowWrapper}>
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
        onNodeMouseEnter={handleNodeHover}
        onNodeMouseLeave={() => setShowTooltip(false)}
        onPaneClick={() => setShowTooltip(false)}
      >
        <Background color="#d1d1d6" gap={16} variant="dots" />
        <MiniMap 
          nodeStrokeColor={(n) => {
            if (n.type === 'useData' || n.type === 'mnist') return '#10b981';
            if (n.type === 'conv2d') return '#3b82f6';
            if (n.type === 'maxPooling2d') return '#6366f1';
            if (n.type === 'dense') return '#f59e0b';
            if (n.type === 'trainButton') return '#ef4444';
            if (n.type === 'activation') return '#ec4899';
            if (n.type === 'avgPooling2d') return '#6366f1';
            if (n.type === 'gru') return '#8b5cf6';
            if (n.type === 'reshape') return '#06b6d4';
            return '#9ca3af';
          }}
          nodeColor={(n) => {
            if (n.type === 'useData' || n.type === 'mnist') return '#a7f3d0';
            if (n.type === 'conv2d') return '#93c5fd';
            if (n.type === 'maxPooling2d') return '#c7d2fe';
            if (n.type === 'dense') return '#fed7aa';
            if (n.type === 'trainButton') return '#fca5a5';
            if (n.type === 'activation') return '#fbcfe8';
            if (n.type === 'avgPooling2d') return '#c7d2fe';
            if (n.type === 'gru') return '#e9d5ff';
            if (n.type === 'reshape') return '#a5f3fc';
            return '#d1d5db';
          }}
        />
        <Controls />
        <Panel position="top-right">
          <div className="bg-white p-3 rounded-xl shadow-md">
            <h3 className="text-sm font-medium text-gray-800">Drag & Drop Components</h3>
          </div>
        </Panel>
        <Panel position="bottom-center">
          <div className="flex space-x-4">
            <button 
              onClick={generateCode}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-xl shadow-md transition duration-150 ease-in-out mb-5"
            >
              Generate TensorFlow.js Code
            </button>
            <button 
              onClick={openTensorboard}
              disabled={tensorboardStatus === 'loading'}
              className={`${
                tensorboardStatus === 'loading' 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white font-medium py-2 px-6 rounded-xl shadow-md transition duration-150 ease-in-out mb-5`}
            >
              {tensorboardStatus === 'loading' 
                ? '准备中...' 
                : tensorboardStatus === 'ready' 
                  ? '在TensorBoard中查看' 
                  : '查看TensorBoard'}
            </button>
          </div>
        </Panel>
      </ReactFlow>
      
      {/* 代码生成弹窗 */}
      {isModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-800">Generated TensorFlow.js Model Code</h3>
              <button 
                onClick={() => setIsModalVisible(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto font-mono text-sm whitespace-pre-wrap">
                {generatedCode}
              </pre>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button 
                onClick={copyCodeToClipboard}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                Copy Code
              </button>
              <button 
                onClick={() => setIsModalVisible(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 层信息悬浮提示 */}
      <LayerTooltip 
        layerInfo={tooltipInfo}
        visible={showTooltip}
        position={tooltipPosition}
      />
    </div>
  );
}

export default FlowWithProvider;


