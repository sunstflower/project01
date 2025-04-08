import React from 'react';
import { 
  FaDatabase, 
  FaImage, 
  FaLayerGroup, 
  FaNetworkWired, 
  FaPlay,
  FaTint,
  FaChartBar,
  FaCompress,
  FaExchangeAlt,
  FaRandom,
  FaCode,
  FaExpand,
  FaCog
} from 'react-icons/fa';

const DraggableNode = ({ type, label }) => {
  const getIcon = () => {
    switch (type) {
      case 'useData':
        return <FaDatabase className="text-blue-500" />;
      case 'mnist':
        return <FaImage className="text-purple-500" />;
      case 'conv2d':
        return <FaLayerGroup className="text-green-500" />;
      case 'maxPooling2d':
      case 'avgPooling2d':
        return <FaCompress className="text-orange-500" />;
      case 'dense':
        return <FaNetworkWired className="text-red-500" />;
      case 'dropout':
        return <FaTint className="text-blue-400" />;
      case 'batchNorm':
        return <FaChartBar className="text-yellow-500" />;
      case 'flatten':
        return <FaCompress className="text-gray-500" />;
      case 'lstm':
      case 'gru':
        return <FaExchangeAlt className="text-indigo-500" />;
      case 'activation':
        return <FaCode className="text-pink-500" />;
      case 'reshape':
        return <FaExpand className="text-teal-500" />;
      case 'trainButton':
        return <FaPlay className="text-green-600" />;
      default:
        return <FaCog className="text-gray-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'useData':
        return 'bg-blue-50 hover:bg-blue-100';
      case 'mnist':
        return 'bg-purple-50 hover:bg-purple-100';
      case 'conv2d':
        return 'bg-green-50 hover:bg-green-100';
      case 'maxPooling2d':
      case 'avgPooling2d':
        return 'bg-orange-50 hover:bg-orange-100';
      case 'dense':
        return 'bg-red-50 hover:bg-red-100';
      case 'dropout':
        return 'bg-blue-50 hover:bg-blue-100';
      case 'batchNorm':
        return 'bg-yellow-50 hover:bg-yellow-100';
      case 'flatten':
        return 'bg-gray-50 hover:bg-gray-100';
      case 'lstm':
      case 'gru':
        return 'bg-indigo-50 hover:bg-indigo-100';
      case 'activation':
        return 'bg-pink-50 hover:bg-pink-100';
      case 'reshape':
        return 'bg-teal-50 hover:bg-teal-100';
      case 'trainButton':
        return 'bg-green-50 hover:bg-green-100';
      default:
        return 'bg-gray-50 hover:bg-gray-100';
    }
  };

  return (
    <div className={`flex items-center p-3 rounded-lg cursor-move transition-colors duration-200 ${getBackgroundColor()}`}>
      <div className="mr-3 text-xl">
        {getIcon()}
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
  );
};

export default DraggableNode;



