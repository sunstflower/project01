import React from 'react';
import { Handle } from '@xyflow/react';
import { Card, Typography } from 'antd';

const { Title, Text } = Typography;

const FlattenNode = ({ id }) => {
  return (
    <Card
      title={<Title level={5}>Flatten</Title>}
      size="small"
      style={{
        width: 280,
        borderRadius: '12px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#fdfdfd',
        borderColor: '#fde68a', // Light yellow border
      }}
      styles={{
        header: {
          backgroundColor: '#fde68a',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
        },
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{ background: '#fbbf24', width: '10px', height: '10px' }}
      />

      <div style={{ padding: '8px 0' }}>
        <Text>
          将多维输入展平为一维向量，通常用于连接卷积/池化层与全连接层
        </Text>
        
        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            该层没有可配置的参数
          </Text>
        </div>
      </div>

      <Handle
        type="source"
        position="right"
        style={{ background: '#fbbf24', width: '10px', height: '10px' }}
      />
    </Card>
  );
};

export default FlattenNode; 