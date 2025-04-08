import React, { useState } from 'react';
import { Handle } from '@xyflow/react';
import { Card, Typography, InputNumber, Select, Space, Divider } from 'antd';
import useStore from '@/store';

const { Title, Text } = Typography;

const POOL_SIZE_OPTIONS = [
  { value: '(2, 2)', label: '2x2' },
  { value: '(3, 3)', label: '3x3' },
  { value: '(4, 4)', label: '4x4' },
];

const PADDING_OPTIONS = [
  { value: 'valid', label: 'Valid' },
  { value: 'same', label: 'Same' },
];

const AvgPooling2DNode = ({ id, data }) => {
  const { avgPooling2dConfigs, updateAvgPooling2dConfig } = useStore();
  const config = avgPooling2dConfigs[data.index] || {
    poolSize: '(2, 2)',
    strides: '(2, 2)',
    padding: 'valid',
  };

  const [poolSize, setPoolSize] = useState(config.poolSize);
  const [strides, setStrides] = useState(config.strides);
  const [padding, setPadding] = useState(config.padding);

  const handlePoolSizeChange = (value) => {
    setPoolSize(value);
    updateAvgPooling2dConfig(data.index, { ...config, poolSize: value });
  };

  const handleStridesChange = (value) => {
    setStrides(value);
    updateAvgPooling2dConfig(data.index, { ...config, strides: value });
  };

  const handlePaddingChange = (value) => {
    setPadding(value);
    updateAvgPooling2dConfig(data.index, { ...config, padding: value });
  };

  return (
    <Card
      title={<Title level={5}>AvgPooling2D</Title>}
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
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>池化大小:</Text>
            <Select
              value={poolSize}
              onChange={handlePoolSizeChange}
              options={POOL_SIZE_OPTIONS}
              style={{ width: '100%', marginTop: 8 }}
            />
          </div>

          <div>
            <Text strong>步长:</Text>
            <Select
              value={strides}
              onChange={handleStridesChange}
              options={POOL_SIZE_OPTIONS}
              style={{ width: '100%', marginTop: 8 }}
            />
          </div>

          <div>
            <Text strong>填充:</Text>
            <Select
              value={padding}
              onChange={handlePaddingChange}
              options={PADDING_OPTIONS}
              style={{ width: '100%', marginTop: 8 }}
            />
          </div>
        </Space>

        <Divider style={{ margin: '12px 0' }} />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            对输入特征图进行平均池化操作
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            通过计算池化窗口内所有值的平均值来降维
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

export default AvgPooling2DNode; 