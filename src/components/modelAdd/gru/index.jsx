import React, { useState } from 'react';
import { Handle } from '@xyflow/react';
import { Card, InputNumber, Typography, Tooltip, Select, Switch, Divider } from 'antd';
import useStore from '@/store';

const { Title, Text } = Typography;
const { Option } = Select;

const GRUNode = ({ id, data }) => {
  const { gruConfigs, updateGruConfig } = useStore();
  const config = gruConfigs[data.index] || {
    units: 128,
    activation: 'tanh',
    recurrentActivation: 'sigmoid',
    returnSequences: false,
    dropout: 0.0,
    recurrentDropout: 0.0,
  };

  const [units, setUnits] = useState(config.units);
  const [activation, setActivation] = useState(config.activation);
  const [recurrentActivation, setRecurrentActivation] = useState(config.recurrentActivation);
  const [returnSequences, setReturnSequences] = useState(config.returnSequences);
  const [dropout, setDropout] = useState(config.dropout);
  const [recurrentDropout, setRecurrentDropout] = useState(config.recurrentDropout);

  const handleUnitsChange = (value) => {
    if (value !== null) {
      setUnits(value);
      updateGruConfig(data.index, { units: value });
    }
  };

  const handleActivationChange = (value) => {
    setActivation(value);
    updateGruConfig(data.index, { activation: value });
  };

  const handleRecurrentActivationChange = (value) => {
    setRecurrentActivation(value);
    updateGruConfig(data.index, { recurrentActivation: value });
  };

  const handleReturnSequencesChange = (checked) => {
    setReturnSequences(checked);
    updateGruConfig(data.index, { returnSequences: checked });
  };

  const handleDropoutChange = (value) => {
    if (value !== null) {
      setDropout(value);
      updateGruConfig(data.index, { dropout: value });
    }
  };

  const handleRecurrentDropoutChange = (value) => {
    if (value !== null) {
      setRecurrentDropout(value);
      updateGruConfig(data.index, { recurrentDropout: value });
    }
  };

  return (
    <Card
      title={<Title level={5}>GRU</Title>}
      size="small"
      style={{
        width: 280,
        borderRadius: '12px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#fdfdfd',
        borderColor: '#c7d2fe', // Light purple border
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
        <Tooltip title="隐藏层神经元数量">
          <Text strong>单元数:</Text>
          <InputNumber
            min={1}
            max={1024}
            step={16}
            value={units}
            onChange={handleUnitsChange}
            style={{ width: '100%', marginTop: 8 }}
          />
        </Tooltip>

        <Divider style={{ margin: '12px 0' }} />
        
        <Text strong>激活函数:</Text>
        <Select
          value={activation}
          onChange={handleActivationChange}
          style={{ width: '100%', marginTop: 8 }}
        >
          <Option value="tanh">tanh</Option>
          <Option value="relu">ReLU</Option>
          <Option value="sigmoid">Sigmoid</Option>
          <Option value="softmax">Softmax</Option>
          <Option value="linear">Linear</Option>
        </Select>

        <Divider style={{ margin: '12px 0' }} />
        
        <Text strong>循环激活函数:</Text>
        <Select
          value={recurrentActivation}
          onChange={handleRecurrentActivationChange}
          style={{ width: '100%', marginTop: 8 }}
        >
          <Option value="sigmoid">Sigmoid</Option>
          <Option value="tanh">tanh</Option>
          <Option value="relu">ReLU</Option>
          <Option value="hard_sigmoid">Hard Sigmoid</Option>
        </Select>

        <Divider style={{ margin: '12px 0' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tooltip title="是否返回完整序列还是仅返回最后一个时间步的输出">
            <Text strong>返回序列:</Text>
          </Tooltip>
          <Switch checked={returnSequences} onChange={handleReturnSequencesChange} />
        </div>

        <Divider style={{ margin: '12px 0' }} />
        
        <Tooltip title="输入的dropout比率">
          <Text strong>Dropout:</Text>
          <InputNumber
            min={0}
            max={1}
            step={0.1}
            value={dropout}
            onChange={handleDropoutChange}
            style={{ width: '100%', marginTop: 8 }}
          />
        </Tooltip>

        <Divider style={{ margin: '12px 0' }} />
        
        <Tooltip title="循环状态的dropout比率">
          <Text strong>循环Dropout:</Text>
          <InputNumber
            min={0}
            max={1}
            step={0.1}
            value={recurrentDropout}
            onChange={handleRecurrentDropoutChange}
            style={{ width: '100%', marginTop: 8 }}
          />
        </Tooltip>

        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            门控循环单元层，比LSTM更简单的循环神经网络结构
          </Text>
        </div>
      </div>

      <Handle
        type="source"
        position="right"
        style={{ background: '#8b5cf6', width: '10px', height: '10px' }}
      />
    </Card>
  );
};

export default GRUNode; 