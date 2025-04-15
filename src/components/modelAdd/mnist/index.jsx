import React from 'react';
import NodeContainer from '../NodeContainer';

function MnistDataNode() {
  return (
    <NodeContainer title="MNIST Dataset" backgroundColor="green-50" hasInputHandle={false}>
      <div>
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <rect x="7" y="7" width="10" height="10" rx="1" ry="1"></rect>
            </svg>
          </div>
        </div>
        
        <div className="bg-white p-2 rounded-md mb-3">
          <p className="text-xs text-gray-700">
            MNIST dataset with 60,000 training examples and 10,000 test examples of handwritten digits (0-9).
          </p>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Format:</span>
            <span className="font-medium">28x28 grayscale images</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Classes:</span>
            <span className="font-medium">10 (digits 0-9)</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Training samples:</span>
            <span className="font-medium">60,000</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Test samples:</span>
            <span className="font-medium">10,000</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button className="bg-green-100 text-green-700 w-full py-1 rounded-md text-xs font-medium hover:bg-green-200 transition-colors">
            Load Dataset
          </button>
        </div>
      </div>
    </NodeContainer>
  );
}

export default MnistDataNode; 