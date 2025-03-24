import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // 使用 React Router 的钩子

const Dropdown = ({ options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null); // 新增选中状态
  const navigate = useNavigate(); // 用于路由跳转
  const location = useLocation(); // 获取当前路径

  // 初始化选中项（根据当前路径）
  useEffect(() => {
    const currentPath = location.pathname.slice(1); // 去除开头的 '/'
    const initialOption = options.find(opt => opt.path === currentPath);
    if (initialOption) {
      setSelectedOption(initialOption);
    }
  }, [location.pathname, options]);

  return (
    <div className="relative w-96">
      <div
        className="flex items-center justify-between px-4 py-3 bg-white border rounded-lg shadow-md cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-xl font-medium">
          {selectedOption?.label || '请选择'} {/* 显示选中的选项 */}
        </span>
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-md overflow-hidden">
          {options.map((option) => (
            <div
              key={option.value}
              className="px-4 py-3 hover:bg-blue-100 cursor-pointer transition"
              onClick={() => {
                setSelectedOption(option); // 更新选中状态
                setIsOpen(false);
                navigate(`/${option.path}`); // 使用路由跳转替代 window.location
              }}
            >
              <span className="text-lg">{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;