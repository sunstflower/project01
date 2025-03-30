import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import Conv2DNode from './Conv2DNode';
import MaxPooling2DNode from './MaxPooling2DNode'; // 假设你有一个类似的 MaxPooling2DNode 组件

function DropZone({ onAddNode }) {
  const [, drop] = useDrop(() => ({
    accept: ['CONV2D_NODE', 'MAX_POOLING2D_NODE'],
    drop(item) {
      onAddNode(item.type);
    },
  }));

  return (
    <div ref={drop} className="mt-4">
      {/* 这里将显示已添加的节点 */}
    </div>
  );
}

export default DropZone;