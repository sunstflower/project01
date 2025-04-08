import React, { useState } from 'react';
import { Handle } from '@xyflow/react';
import { Card, InputNumber, Typography, Tooltip } from 'antd';
import useStore from '@/store';

const { Title, Text } = Typography;

const DropoutNode = ({ id, data }) => {
  const { dropoutConfigs, updateDropoutConfig } = useStore();
  const config = dropoutConfigs[data.index] || { rate: 0.2 };
  const [rate, setRate] = useState(config.rate);

  const handleRateChange = (value) => {
    if (value !== null) {
      setRate(value);
      updateDropoutConfig(data.index, { rate: value });
    }
  };

  return (
    <Card
      title={<Title level={5}>Dropout</Title>}
      size="small"
      style={{
        width: 280,
        borderRadius: '12px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#fdfdfd',
        borderColor: '#dbeafe', // Light blue border
      }}
      styles={{
        header: {
          backgroundColor: '#dbeafe',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
        },
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{ background: '#93c5fd', width: '10px', height: '10px' }}
      />

      <div style={{ padding: '8px 0' }}>
        <Tooltip title="丢弃率 (0-1 之间的值)">
          <Text strong>丢弃率:</Text>
          <InputNumber
            min={0}
            max={1}
            step={0.05}
            value={rate}
            onChange={handleRateChange}
            style={{ width: '100%', marginTop: 8 }}
          />
        </Tooltip>
        
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            在训练期间随机将输入单元设置为0的比率，有助于防止过拟合
          </Text>
        </div>
      </div>

      <Handle
        type="source"
        position="right"
        style={{ background: '#93c5fd', width: '10px', height: '10px' }}
      />
    </Card>
  );
};

export default DropoutNode; 