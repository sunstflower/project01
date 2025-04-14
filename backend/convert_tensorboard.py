#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import sys
import os
import numpy as np
from datetime import datetime
import traceback

# 设置日志记录
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 确保TensorFlow安装了
try:
    import tensorflow as tf
    logger.info(f"TensorFlow版本: {tf.__version__}")
except ImportError:
    logger.error("未安装TensorFlow,请运行: pip install tensorflow>=2.4.0")
    sys.exit(1)

def create_model_from_data(model_data):
    """从JSON数据创建一个TensorFlow模型"""
    structure = model_data.get('structure', [])
    connections = model_data.get('connections', [])
    configs = model_data.get('configs', {})
    
    logger.info(f"模型结构包含{len(structure)}个节点")
    
    # 创建序贯模型
    model = tf.keras.Sequential()
    
    # 添加层
    input_shape_added = False
    
    for layer in structure:
        layer_type = layer.get('type')
        config = layer.get('config', {})
        
        if layer_type not in ['useData', 'mnist', 'trainButton']:  # 跳过非模型层
            logger.info(f"添加层: {layer_type}")
            
            try:
                if layer_type == 'conv2d':
                    if not input_shape_added:
                        model.add(tf.keras.layers.Conv2D(
                            filters=config.get('filters', 32),
                            kernel_size=config.get('kernelSize', 3),
                            strides=config.get('strides', 1),
                            padding=config.get('padding', 'valid'),
                            activation=config.get('activation', 'relu'),
                            input_shape=(28, 28, 1)  # 假设MNIST格式
                        ))
                        input_shape_added = True
                    else:
                        model.add(tf.keras.layers.Conv2D(
                            filters=config.get('filters', 32),
                            kernel_size=config.get('kernelSize', 3),
                            strides=config.get('strides', 1),
                            padding=config.get('padding', 'valid'),
                            activation=config.get('activation', 'relu')
                        ))
                
                elif layer_type == 'maxPooling2d':
                    model.add(tf.keras.layers.MaxPooling2D(
                        pool_size=config.get('poolSize', 2),
                        strides=config.get('strides', None),
                        padding=config.get('padding', 'valid')
                    ))
                    
                elif layer_type == 'flatten':
                    model.add(tf.keras.layers.Flatten())
                    
                elif layer_type == 'dense':
                    model.add(tf.keras.layers.Dense(
                        units=config.get('units', 128),
                        activation=config.get('activation', 'relu')
                    ))
                    
                elif layer_type == 'dropout':
                    model.add(tf.keras.layers.Dropout(
                        rate=config.get('rate', 0.5)
                    ))
                    
                elif layer_type == 'batchNorm':
                    model.add(tf.keras.layers.BatchNormalization())
                    
                elif layer_type == 'activation':
                    model.add(tf.keras.layers.Activation(
                        activation=config.get('activation', 'relu')
                    ))
                    
                elif layer_type == 'avgPooling2d':
                    model.add(tf.keras.layers.AveragePooling2D(
                        pool_size=config.get('poolSize', 2),
                        strides=config.get('strides', None),
                        padding=config.get('padding', 'valid')
                    ))
                    
                elif layer_type == 'lstm':
                    # 如果前一层不是序列/时间序列格式，添加Reshape层
                    if not input_shape_added:
                        model.add(tf.keras.layers.Reshape((28, 28)))
                        input_shape_added = True
                    model.add(tf.keras.layers.LSTM(
                        units=config.get('units', 64),
                        activation=config.get('activation', 'tanh'),
                        recurrent_activation=config.get('recurrentActivation', 'sigmoid'),
                        return_sequences=config.get('returnSequences', False)
                    ))
                    
                elif layer_type == 'gru':
                    # 如果前一层不是序列/时间序列格式，添加Reshape层
                    if not input_shape_added:
                        model.add(tf.keras.layers.Reshape((28, 28)))
                        input_shape_added = True
                    model.add(tf.keras.layers.GRU(
                        units=config.get('units', 64),
                        activation=config.get('activation', 'tanh'),
                        recurrent_activation=config.get('recurrentActivation', 'sigmoid'),
                        return_sequences=config.get('returnSequences', False)
                    ))
                    
                elif layer_type == 'reshape':
                    target_shape = config.get('targetShape', [7, 7, 16])
                    model.add(tf.keras.layers.Reshape(target_shape))
            
            except Exception as e:
                logger.error(f"添加层 {layer_type} 时出错: {str(e)}")
                logger.error(traceback.format_exc())
    
    # 添加输出层（如果尚未添加）
    if len(model.layers) > 0 and not isinstance(model.layers[-1], tf.keras.layers.Dense):
        logger.info("添加输出层: Dense(10, activation='softmax')")
        model.add(tf.keras.layers.Dense(10, activation='softmax'))
        
    return model

def generate_tensorboard_logs(model):
    """为模型生成TensorBoard日志"""
    # 创建日志目录
    log_dir = os.path.join(os.path.dirname(__file__), 'tb_logs', datetime.now().strftime("%Y%m%d-%H%M%S"))
    os.makedirs(log_dir, exist_ok=True)
    
    logger.info(f"TensorBoard日志目录: {log_dir}")
    
    # 生成一些模拟训练数据
    x_train = np.random.random((100, 28, 28, 1))
    y_train = np.random.randint(0, 10, (100,))
    
    # 编译模型
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # 创建TensorBoard回调
    tensorboard_callback = tf.keras.callbacks.TensorBoard(
        log_dir=log_dir,
        histogram_freq=1,
        write_graph=True,
        write_images=True,
        update_freq='epoch',
        profile_batch=0
    )
    
    # 进行一次简短的训练以生成日志
    model.fit(
        x_train, y_train,
        epochs=5,
        batch_size=32,
        validation_split=0.2,
        callbacks=[tensorboard_callback],
        verbose=1
    )
    
    # 生成一些额外的自定义指标
    file_writer = tf.summary.create_file_writer(os.path.join(log_dir, 'metrics'))
    with file_writer.as_default():
        # 添加一些自定义标量
        for i in range(10):
            value = np.random.random()
            tf.summary.scalar('custom_metric', value, step=i)
            
        # 添加一些测试图像
        test_images = x_train[:5]
        tf.summary.image("test_images", test_images, max_outputs=5, step=0)
        
        # 添加模型图
        tf.summary.trace_export(
            name="model_trace",
            step=0,
            profiler_outdir=log_dir
        )
    
    logger.info("TensorBoard日志生成完成")
    return log_dir

def main():
    if len(sys.argv) < 2:
        logger.error("用法: python convert_tensorboard.py <model_data_json_file>")
        sys.exit(1)
    
    # 加载模型数据
    data_path = sys.argv[1]
    logger.info(f"加载模型数据: {data_path}")
    
    try:
        with open(data_path, 'r') as f:
            model_data = json.load(f)
    except Exception as e:
        logger.error(f"加载JSON数据失败: {str(e)}")
        sys.exit(1)
    
    # 创建模型
    try:
        model = create_model_from_data(model_data)
        logger.info("模型创建成功")
        model.summary()
    except Exception as e:
        logger.error(f"创建模型失败: {str(e)}")
        logger.error(traceback.format_exc())
        sys.exit(1)
    
    # 生成TensorBoard日志
    try:
        log_dir = generate_tensorboard_logs(model)
        
        # 创建一个成功标记文件
        with open(os.path.join(os.path.dirname(__file__), 'tb_ready.txt'), 'w') as f:
            f.write(log_dir)
        
        logger.info("TensorBoard准备就绪")
    except Exception as e:
        logger.error(f"生成TensorBoard日志失败: {str(e)}")
        logger.error(traceback.format_exc())
        sys.exit(1)

if __name__ == "__main__":
    main() 