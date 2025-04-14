import React from 'react';
import PropTypes from 'prop-types';

/**
 * 层信息悬浮提示组件
 */
const LayerTooltip = ({ layerInfo, visible, position }) => {
  if (!visible || !layerInfo) return null;
  
  const { name, description, params, inputShape, outputShape } = layerInfo;
  
  return (
    <div 
      className="absolute z-50 bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-md"
      style={{
        left: position.x + 'px',
        top: position.y + 'px',
        transform: 'translate(20px, -50%)'
      }}
    >
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-2">{name}</h3>
      
      <div className="mb-3">
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div className="font-medium text-gray-700">输入形状:</div>
        <div className="text-gray-600 font-mono">{inputShape}</div>
        
        <div className="font-medium text-gray-700">输出形状:</div>
        <div className="text-gray-600 font-mono">{outputShape}</div>
      </div>
      
      {params && params.length > 0 && (
        <>
          <div className="font-medium text-gray-700 mb-1 text-sm">参数:</div>
          <div className="bg-gray-50 p-2 rounded">
            {params.map((param, index) => (
              <div key={index} className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">{param.name}:</div>
                <div className="text-gray-800 font-mono">{param.value}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

LayerTooltip.propTypes = {
  layerInfo: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    params: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })),
    inputShape: PropTypes.string,
    outputShape: PropTypes.string
  }),
  visible: PropTypes.bool,
  position: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number
  })
};

LayerTooltip.defaultProps = {
  visible: false,
  position: { x: 0, y: 0 }
};

export default LayerTooltip; 