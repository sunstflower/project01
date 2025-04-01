import React from 'react';
import { Handle, Position } from '@xyflow/react';

function MnistDataNode() {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 w-80 border border-gray-200">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <rect x="7" y="7" width="10" height="10" rx="1" ry="1"></rect>
          </svg>
        </div>
        <h3 className="text-lg font-semibold">MNIST Dataset</h3>
      </div>
      
      <div className="bg-gray-50 p-3 rounded-md mb-4">
        <p className="text-sm text-gray-700">
          MNIST dataset with 60,000 training examples and 10,000 test examples of handwritten digits (0-9).
        </p>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Format:</span>
          <span className="font-medium">28x28 grayscale images</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Classes:</span>
          <span className="font-medium">10 (digits 0-9)</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Training samples:</span>
          <span className="font-medium">60,000</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Test samples:</span>
          <span className="font-medium">10,000</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="bg-green-50 text-green-700 w-full py-2 rounded-md text-sm font-medium hover:bg-green-100 transition-colors">
          Load Dataset
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        className="w-4 h-4 bg-green-400 rounded-full"
      />
    </div>
  );
}

export default MnistDataNode; 