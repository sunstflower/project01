import React, { useState } from 'react';
import { Handle } from '@xyflow/react';
import { Card, InputNumber, Typography, Tooltip, Switch, Divider } from 'antd';
import useStore from '@/store';

const { Title, Text } = Typography;

const BatchNormNode = ({ id, data }) => {
  const { batchNormConfigs, updateBatchNormConfig } = useStore();
  const config = batchNormConfigs[data.index] || {
    axis: -1,
    momentum: 0.99,
    epsilon: 0.001,
    center: true,
    scale: true,
  };

  const [momentum, setMomentum] = useState(config.momentum);
  const [epsilon, setEpsilon] = useState(config.epsilon);
  const [center, setCenter] = useState(config.center);
  const [scale, setScale] = useState(config.scale);

  const handleMomentumChange = (value) => {
    if (value !== null) {
      setMomentum(value);
      updateBatchNormConfig(data.index, { momentum: value });
    }
  };

  const handleEpsilonChange = (value) => {
    if (value !== null) {
      setEpsilon(value);
      updateBatchNormConfig(data.index, { epsilon: value });
    }
  };

  const handleCenterChange = (checked) => {
    setCenter(checked);
    updateBatchNormConfig(data.index, { center: checked });
  };

  const handleScaleChange = (checked) => {
    setScale(checked);
    updateBatchNormConfig(data.index, { scale: checked });
  };

  return (
    <Card
      title={<Title level={5}>Batch Normalization</Title>}
      size="small"
      style={{
        width: 280,
        borderRadius: '12px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#fdfdfd',
        borderColor: '#e0e7ff', // Light indigo border
      }}
      styles={{
        header: {
          backgroundColor: '#e0e7ff',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
        },
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{ background: '#818cf8', width: '10px', height: '10px' }}
      />

      <div style={{ padding: '8px 0' }}>
        <Tooltip title="用于计算指数移动平均值的动量">
          <Text strong>动量:</Text>
          <InputNumber
            min={0}
            max={1}
            step={0.01}
            value={momentum}
            onChange={handleMomentumChange}
            style={{ width: '100%', marginTop: 8 }}
          />
        </Tooltip>

        <Divider style={{ margin: '12px 0' }} />
        
        <Tooltip title="添加到方差的小常数，避免除零">
          <Text strong>Epsilon:</Text>
          <InputNumber
            min={0.0001}
            max={0.1}
            step={0.0001}
            value={epsilon}
            onChange={handleEpsilonChange}
            style={{ width: '100%', marginTop: 8 }}
          />
        </Tooltip>

        <Divider style={{ margin: '12px 0' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tooltip title="是否将偏移参数添加到归一化的张量">
            <Text strong>Center:</Text>
          </Tooltip>
          <Switch checked={center} onChange={handleCenterChange} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <Tooltip title="是否将缩放参数应用于归一化的张量">
            <Text strong>Scale:</Text>
          </Tooltip>
          <Switch checked={scale} onChange={handleScaleChange} />
        </div>

        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            标准化每个批次的激活以加速训练并提高模型稳定性
          </Text>
        </div>
      </div>

      <Handle
        type="source"
        position="right"
        style={{ background: '#818cf8', width: '10px', height: '10px' }}
      />
    </Card>
  );
};

export default BatchNormNode; 