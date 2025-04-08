import React from 'react';
import { useDrop } from 'react-dnd';

const DropZone = ({ onAddNode }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: [
      'useData',
      'mnist',
      'conv2d',
      'maxPooling2d',
      'avgPooling2d',
      'dense',
      'dropout',
      'batchNorm',
      'flatten',
      'lstm',
      'gru',
      'activation',
      'reshape',
      'trainButton'
    ],
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      onAddNode(item.type, offset);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`w-full h-full min-h-[500px] ${
        isOver ? 'bg-blue-50' : 'bg-white'
      } transition-colors duration-200`}
    />
  );
};

export default DropZone;