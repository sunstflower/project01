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
import projectService from '../../services/projectService';
import Header from '../Header';
import { useParams, useNavigate } from 'react-router-dom';

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
  // 获取URL参数中的项目ID
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // 添加跟踪渲染和节点/边数量变化的ref
  const isFirstRender = useRef(true);
  const prevElementsLength = useRef(0);
  const prevEdgesLength = useRef(0);
  
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
    currentProject,
    setCurrentProject,
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
  
  // 从URL加载项目
  useEffect(() => {
    const loadProjectFromUrl = async () => {
      if (projectId) {
        try {
          // 获取项目详情
          const project = projectService.getProject(projectId);
          if (!project) {
            console.error('项目不存在：', projectId);
            navigate('/flow');
            return;
          }
          
          // 设置当前项目
          setCurrentProject(project);
          
          // 解析和加载项目数据
          if (project.flowData) {
            try {
              const flowData = JSON.parse(project.flowData);
              setElements(flowData);
            } catch (e) {
              console.error('解析流程图数据失败:', e);
            }
          }
          
          if (project.edgesData) {
            try {
              const edgesData = JSON.parse(project.edgesData);
              setEdges(edgesData);
            } catch (e) {
              console.error('解析连接数据失败:', e);
            }
          }
          
          if (project.configData) {
            try {
              const configData = JSON.parse(project.configData);
              // 在这里可以加载配置数据到相应的状态
              console.log('加载项目配置:', configData);
            } catch (e) {
              console.error('解析配置数据失败:', e);
            }
          }
          
        } catch (error) {
          console.error('加载项目失败:', error);
        }
      }
    };
    
    loadProjectFromUrl();
    // 只在projectId变化时执行，避免其他依赖变化引起的重复加载
  }, [projectId, navigate]);
  
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
    
    // 防止无限循环：检查是否有需要标记的节点且该节点的配置确实需要更新
    if (outputDenseNodes.length > 0) {
      // 对每个找到的输出层Dense节点设置isOutput标志
      outputDenseNodes.forEach(outputNode => {
        const index = outputNode.data?.index || 0;
        
        // 检查当前配置，只有当配置不存在或需要更新时才更新
        const currentConfig = denseConfigs[index] || {};
        const needsUpdate = !currentConfig.isOutput || 
                           currentConfig.units !== 10 || 
                           currentConfig.activation !== 'softmax';
        
        if (needsUpdate) {
          console.log(`标记Dense节点 ${outputNode.id} 为输出层，并设置默认单位为10`);
          updateDenseConfig(index, {
            units: 10,
            activation: 'softmax',
            kernelInitializer: 'varianceScaling',
            isOutput: true
          });
        }
      });
    }
  }, [elements, edges, denseConfigs, updateDenseConfig]);

  // 在元素变化后标记输出层，但避免无限循环
  useEffect(() => {
    // 只有当真正添加或删除了节点/连接时才执行标记操作
    // 使用已经在组件顶层定义的ref
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevElementsLength.current = elements.length;
      prevEdgesLength.current = edges.length;
      // 首次渲染时执行一次
      markOutputLayer();
      return;
    }
    
    // 只有当节点或边的数量发生变化时才执行
    if (elements.length !== prevElementsLength.current || 
        edges.length !== prevEdgesLength.current) {
      prevElementsLength.current = elements.length;
      prevEdgesLength.current = edges.length;
      markOutputLayer();
    }
  }, [elements.length, edges.length, markOutputLayer]);

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
    
    // 检查节点是否已经有连接
    const hasConnection = edges.some(edge => edge.target === newNode.id);
    if (hasConnection) return [];
    
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
    // 检查是否已经存在相同时间戳的节点，防止重复添加
    const currentTimestamp = Date.now();
    const nodeId = `${type}-${currentTimestamp}`;
    
    // 检查节点是否已存在
    if (elements.some(node => node.id === nodeId)) {
      console.log(`节点${nodeId}已存在，跳过添加`);
      return;
    }
    
    let newNode = {};
    let configIndex = 0;
    
    // 获取当前节点数量作为序列ID
    const sequenceId = elements.length;
    
    // 根据节点类型创建不同的节点
    if (type === 'conv2d') {
      configIndex = conv2dConfigs.length;
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
      newNode = {
        id: nodeId,
        type: 'trainButton',
        data: { 
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'useData') {
      newNode = {
        id: nodeId,
        type: 'useData',
        data: { 
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'mnist') {
      newNode = {
        id: nodeId,
        type: 'mnist',
        data: { 
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'dropout') {
      newNode = {
        id: nodeId,
        type: 'dropout',
        data: { 
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'batchNorm') {
      newNode = {
        id: nodeId,
        type: 'batchNorm',
        data: { 
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'flatten') {
      newNode = {
        id: nodeId,
        type: 'flatten',
        data: { 
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'lstm') {
      newNode = {
        id: nodeId,
        type: 'lstm',
        data: { 
          sequenceId: sequenceId 
        },
        position,
      };
    } else if (type === 'activation') {
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

  // 添加项目保存功能
  const saveCurrentProject = async (getStateOnly = false) => {
    try {
      // 记录保存前的项目状态
      console.log('保存项目前 - 当前项目状态:', currentProject);
      console.log('仅获取状态模式:', getStateOnly);
      
      // 收集当前的流程图和配置数据
      const flowData = elements;
      const edgesData = edges;
      
      // 收集所有配置
      const configData = {
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
      };
      
      // 如果只需要获取当前状态，不实际保存
      if (getStateOnly) {
        console.log('只返回项目状态，不保存');
        return {
          flowData: JSON.stringify(flowData),
          edgesData: JSON.stringify(edgesData),
          configData: JSON.stringify(configData),
          tempName: currentProject?.name || '未命名项目',
          description: currentProject?.description || ''
        };
      }
      
      let resultProject = null;
      
      if (!currentProject || !currentProject.id) {
        // 如果没有当前项目或是新项目，创建一个新项目
        const name = prompt('请输入项目名称:', '未命名项目');
        if (!name) return null; // 用户取消
        
        const description = prompt('请输入项目描述 (可选):', '');
        
        const newProject = await projectService.createProject({
          name,
          description,
          flowData: JSON.stringify(flowData),
          edgesData: JSON.stringify(edgesData),
          configData: JSON.stringify(configData),
        });
        
        console.log('创建的新项目:', newProject);
        
        // 确保新项目有ID
        if (!newProject || !newProject.id) {
          console.error('创建的项目没有ID:', newProject);
          throw new Error('创建项目失败：无法生成项目ID');
        }
        
        setCurrentProject(newProject);
        resultProject = newProject;
      } else {
        // 更新现有项目
        const updatedProject = await projectService.updateProject(
          currentProject.id,
          {
            flowData: JSON.stringify(flowData),
            edgesData: JSON.stringify(edgesData),
            configData: JSON.stringify(configData),
          }
        );
        
        console.log('更新后的项目:', updatedProject);
        
        // 确保更新后的项目有ID
        if (!updatedProject || !updatedProject.id) {
          console.error('更新后的项目没有ID:', updatedProject);
          throw new Error('更新项目失败：项目ID丢失');
        }
        
        setCurrentProject(updatedProject);
        resultProject = updatedProject;
      }
      
      // 验证项目是否正确保存并有ID
      console.log('保存后的项目:', resultProject);
      console.log('保存后的项目ID:', resultProject?.id);
      
      // 同步更新到localStorage以确保一致性
      if (resultProject && resultProject.id) {
        const allProjects = projectService.getUserProjects();
        console.log('所有项目:', allProjects);
        
        // 确认项目在localStorage中
        const savedProject = projectService.getProject(resultProject.id);
        console.log('从localStorage读取的项目:', savedProject);
        
        if (!savedProject) {
          console.error('项目已保存但未能从localStorage读取');
        }
      }
      
      return resultProject;
    } catch (error) {
      console.error('保存项目失败:', error);
      alert(`保存失败: ${error.message}`);
      throw error;
    }
  };

  return (
    <div className="w-full h-screen flex flex-col">
      <Header currentProject={currentProject} onSaveProject={saveCurrentProject} />
      
      <div className="relative w-full flex-1 min-h-[700px]" ref={reactFlowWrapper}>
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
    </div>
  );
}

export default FlowWithProvider;


