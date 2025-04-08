import React, { useState } from 'react';
import { Handle } from '@xyflow/react';
import { Card, Typography, Input, Divider, Space } from 'antd';
import useStore from '@/store';

const { Title, Text } = Typography;

const ReshapeNode = ({ id, data }) => {
  const { reshapeConfigs, updateReshapeConfig } = useStore();
  const config = reshapeConfigs[data.index] || {
    targetShape: '(None, 784)',
  };

  const [targetShape, setTargetShape] = useState(config.targetShape);

  const handleTargetShapeChange = (e) => {
    const value = e.target.value;
    setTargetShape(value);
    updateReshapeConfig(data.index, { ...config, targetShape: value });
  };

  return (
    <Card
      title={<Title level={5}>Reshape</Title>}
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
        <Text strong>目标形状:</Text>
        <Input
          value={targetShape}
          onChange={handleTargetShapeChange}
          placeholder="例如: (None, 784)"
          style={{ marginTop: 8 }}
        />

        <Divider style={{ margin: '12px 0' }} />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            重塑输入张量的形状
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            使用 None 表示动态维度，例如 (None, 784) 将输入重塑为二维张量
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

export default ReshapeNode;