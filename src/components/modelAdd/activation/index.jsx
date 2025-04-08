import React, { useState } from 'react';
import { Handle } from '@xyflow/react';
import { Card, Typography, Select, Divider, Space } from 'antd';
import useStore from '@/store';

const { Title, Text } = Typography;

const ACTIVATION_OPTIONS = [
  { value: 'relu', label: 'ReLU' },
  { value: 'sigmoid', label: 'Sigmoid' },
  { value: 'tanh', label: 'Tanh' },
  { value: 'softmax', label: 'Softmax' },
  { value: 'elu', label: 'ELU' },
  { value: 'selu', label: 'SELU' },
  { value: 'softplus', label: 'Softplus' },
  { value: 'softsign', label: 'Softsign' },
  { value: 'hard_sigmoid', label: 'Hard Sigmoid' },
  { value: 'exponential', label: 'Exponential' },
];

const ActivationNode = ({ id, data }) => {
  const { activationConfigs, updateActivationConfig } = useStore();
  const config = activationConfigs[data.index] || {
    activation: 'relu',
  };

  const [activation, setActivation] = useState(config.activation);

  const handleActivationChange = (value) => {
    setActivation(value);
    updateActivationConfig(data.index, { ...config, activation: value });
  };

  return (
    <Card
      title={<Title level={5}>Activation</Title>}
      size="small"
      style={{
        width: 280,
        borderRadius: '12px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#fdfdfd',
        borderColor: '#c7d2fe',
      }}
      styles={{
        header: {
          backgroundColor: '#c7d2fe',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
        },
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{ background: '#8b5cf6', width: '10px', height: '10px' }}
      />

      <div style={{ padding: '8px 0' }}>
        <Text strong>激活函数:</Text>
        <Select
          value={activation}
          onChange={handleActivationChange}
          style={{ width: '100%', marginTop: 8 }}
          options={ACTIVATION_OPTIONS}
        />

        <Divider style={{ margin: '12px 0' }} />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            为神经网络层添加非线性变换
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            常用的激活函数包括 ReLU、Sigmoid、Tanh 等
          </Text>
        </Space>
      </div>

      <Handle
        type="source"
        position="right"
        style={{ background: '#8b5cf6', width: '10px', height: '10px' }}
      />
    </Card>
  );
};

export default ActivationNode; 