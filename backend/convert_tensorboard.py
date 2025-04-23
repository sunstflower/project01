#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import sys
import os
import numpy as np
import argparse
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
    # 适应新的数据结构
    structure = model_data.get('modelStructure', [])
    connections = model_data.get('edges', [])
    
    logger.info(f"模型结构包含{len(structure)}个节点和{len(connections)}个连接")
    
    # 检查是否有足够的数据创建模型
    if len(structure) == 0:
        logger.error("没有找到有效的模型结构数据")
        raise ValueError("模型结构为空")
    
    # 创建序贯模型
    model = tf.keras.Sequential()
    
    # 添加层
    input_shape_added = False
    
    # 检查数据源类型，确定输入形状
    input_shape = (28, 28, 1)  # 默认MNIST格式
    has_mnist = any(layer.get('type') == 'mnist' for layer in structure)
    has_csv = any(layer.get('type') == 'useData' for layer in structure)
    
    logger.info(f"数据源: MNIST={has_mnist}, CSV={has_csv}")
    
    # 过滤掉非模型层（如数据源和训练按钮）
    valid_layers = [layer for layer in structure if layer.get('type') not in ['useData', 'mnist', 'trainButton']]
    
    # 对层进行排序，确保它们按照正确的顺序添加
    if connections:
        # 如果有连接数据，根据连接顺序排序
        # 构建图结构
        graph = {}
        for layer in valid_layers:
            graph[layer.get('config', {}).get('sequenceId', 0)] = layer
        
        # 找到入度为0的节点
        in_degree = {seq_id: 0 for seq_id in graph.keys()}
        for conn in connections:
            for layer in valid_layers:
                config = layer.get('config', {})
                if conn.get('target') == f"{layer.get('type')}-{config.get('sequenceId', 0)}":
                    in_degree[config.get('sequenceId', 0)] += 1
        
        # 拓扑排序
        sorted_layers = []
        queue = [seq_id for seq_id, degree in in_degree.items() if degree == 0]
        while queue:
            seq_id = queue.pop(0)
            sorted_layers.append(graph[seq_id])
            
            for conn in connections:
                source_id = conn.get('source').split('-')[1]
                target_id = conn.get('target').split('-')[1]
                if source_id == str(seq_id):
                    for layer in valid_layers:
                        layer_seq_id = layer.get('config', {}).get('sequenceId', 0)
                        if target_id == str(layer_seq_id):
                            in_degree[layer_seq_id] -= 1
                            if in_degree[layer_seq_id] == 0:
                                queue.append(layer_seq_id)
    else:
        # 如果没有连接数据，按照sequenceId排序
        sorted_layers = sorted(valid_layers, key=lambda x: x.get('config', {}).get('sequenceId', 0))
    
    # 记录排序后的层次序
    logger.info(f"排序后的层: {[layer.get('type') for layer in sorted_layers]}")
    
    # 处理每个层
    for layer in sorted_layers:
        layer_type = layer.get('type')
        config = layer.get('config', {})
        
        logger.info(f"添加层: {layer_type} (配置: {config})")
        
        try:
            if layer_type == 'conv2d':
                if not input_shape_added:
                    model.add(tf.keras.layers.Conv2D(
                        filters=config.get('filters', 32),
                        kernel_size=config.get('kernelSize', 3),
                        strides=config.get('strides', 1),
                        padding=config.get('padding', 'valid'),
                        activation=config.get('activation', 'relu'),
                        input_shape=input_shape
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
                pool_size = config.get('poolSize', 2)
                # 确保pool_size是一个元组
                if isinstance(pool_size, int):
                    pool_size = (pool_size, pool_size)
                model.add(tf.keras.layers.MaxPooling2D(
                    pool_size=pool_size,
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
                pool_size = config.get('poolSize', 2)
                # 确保pool_size是一个元组
                if isinstance(pool_size, int):
                    pool_size = (pool_size, pool_size)
                model.add(tf.keras.layers.AveragePooling2D(
                    pool_size=pool_size,
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
    
    # 检查模型是否为空
    if len(model.layers) == 0:
        logger.warning("没有添加任何层到模型中")
        
        # 添加一个示例Conv2D层作为回退
        model.add(tf.keras.layers.Conv2D(
            filters=32,
            kernel_size=3,
            activation='relu',
            input_shape=input_shape
        ))
        
        # 添加Flatten层
        model.add(tf.keras.layers.Flatten())
    
    # 确保模型以Dense输出层结束
    if len(model.layers) > 0 and not isinstance(model.layers[-1], tf.keras.layers.Dense):
        logger.info("添加输出层: Dense(10, activation='softmax')")
        model.add(tf.keras.layers.Flatten())
        model.add(tf.keras.layers.Dense(10, activation='softmax'))
        
    return model

def generate_tensorboard_logs(model, log_dir=None):
    """为模型生成TensorBoard日志"""
    # 创建日志目录
    if log_dir is None:
        log_dir = os.path.join(os.path.dirname(__file__), 'tb_logs', datetime.now().strftime("%Y%m%d-%H%M%S"))
    
    os.makedirs(log_dir, exist_ok=True)
    
    logger.info(f"TensorBoard日志目录: {log_dir}")
    logger.info(f"日志目录绝对路径: {os.path.abspath(log_dir)}")
    
    try:
        # 创建一个简单的摘要文件，确保目录不为空
        with tf.summary.create_file_writer(log_dir).as_default():
            tf.summary.scalar("initialization", 1.0, step=0)
            tf.summary.flush()
        
        # 检查是否生成了摘要文件
        log_files = os.listdir(log_dir)
        logger.info(f"初始化后的日志文件列表: {log_files}")
        
        if not any(f.startswith('events.out.tfevents') for f in log_files):
            logger.warning("未找到TensorFlow事件文件，手动创建一个...")
            # 创建另一个tf.summary以确保生成事件文件
            with tf.summary.create_file_writer(log_dir).as_default():
                for i in range(5):
                    tf.summary.scalar("manual_init", float(i), step=i)
                tf.summary.flush()
            
            # 再次检查
            log_files = os.listdir(log_dir)
            logger.info(f"手动创建后的日志文件列表: {log_files}")
        
        # 获取模型输入形状
        input_shape = None
        if len(model.layers) > 0:
            if hasattr(model.layers[0], 'input_shape'):
                input_shape = model.layers[0].input_shape
                logger.info(f"检测到模型输入形状: {input_shape}")
            else:
                logger.warning("无法检测到模型第一层的输入形状")
                
        # 默认为MNIST形状
        if not input_shape or input_shape[1:] == (None, None, None):
            logger.info("使用默认MNIST输入形状")
            x_train = np.random.random((100, 28, 28, 1))
            y_train = np.random.randint(0, 10, (100,))
        else:
            logger.info(f"根据检测到的输入形状创建训练数据")
            # 排除batch维度
            shape = list(input_shape[1:])
            # 替换所有None为合理的值
            shape = [s if s is not None else 10 for s in shape]
            logger.info(f"调整后的输入形状: {shape}")
            
            # 创建适合这个形状的随机数据
            x_train = np.random.random((100, *shape))
            y_train = np.random.randint(0, 10, (100,))
            
        logger.info(f"创建的训练数据形状: x={x_train.shape}, y={y_train.shape}")
        
        # 创建专用的日志子目录
        train_log_dir = os.path.join(log_dir, 'train')
        os.makedirs(train_log_dir, exist_ok=True)
        
        # 编译模型
        logger.info("编译模型...")
        try:
            model.compile(
                optimizer='adam',
                loss='sparse_categorical_crossentropy',
                metrics=['accuracy']
            )
        except Exception as e:
            logger.error(f"模型编译失败: {str(e)}")
            logger.error(traceback.format_exc())
            
            # 尝试使用不同的损失函数
            logger.info("尝试使用categorical_crossentropy损失函数...")
            try:
                # 将标签转换为one-hot编码
                from tensorflow.keras.utils import to_categorical
                y_train_cat = to_categorical(y_train, num_classes=10)
                
                model.compile(
                    optimizer='adam',
                    loss='categorical_crossentropy',
                    metrics=['accuracy']
                )
                
                # 更新y_train
                y_train = y_train_cat
            except Exception as e2:
                logger.error(f"备选编译也失败: {str(e2)}")
                logger.error(traceback.format_exc())
                raise ValueError("模型编译失败，无法继续")
        
        # 创建TensorBoard回调
        tensorboard_callback = tf.keras.callbacks.TensorBoard(
            log_dir=train_log_dir,
            histogram_freq=1,
            write_graph=True,
            write_images=True,
            update_freq='epoch',
            profile_batch=0
        )
        
        # 进行一次简短的训练以生成日志
        logger.info("开始训练模型...")
        try:
            history = model.fit(
                x_train, y_train,
                epochs=2,  # 减少训练轮数以加快处理
                batch_size=32,
                validation_split=0.2,
                callbacks=[tensorboard_callback],
                verbose=1
            )
            
            # 记录训练历史
            history_log_dir = os.path.join(log_dir, 'history')
            os.makedirs(history_log_dir, exist_ok=True)
            
            # 手动写入训练历史
            with tf.summary.create_file_writer(history_log_dir).as_default():
                for key, values in history.history.items():
                    for step, value in enumerate(values):
                        tf.summary.scalar(key, value, step=step)
                tf.summary.flush()
                
        except Exception as e:
            logger.error(f"模型训练失败: {str(e)}")
            logger.error(traceback.format_exc())
            
            # 尝试记录模型结构而不训练
            logger.info("跳过训练，仅记录模型结构...")
            
            # 直接写入模型图
            try:
                model_log_dir = os.path.join(log_dir, 'model')
                os.makedirs(model_log_dir, exist_ok=True)
                
                # 保存模型图像
                model_image_path = os.path.join(model_log_dir, 'model.png')
                tf.keras.utils.plot_model(
                    model,
                    to_file=model_image_path,
                    show_shapes=True,
                    show_layer_names=True
                )
                logger.info(f"模型图像已保存到: {model_image_path}")
                
                # 创建一个静态的模型摘要
                with tf.summary.create_file_writer(model_log_dir).as_default():
                    # 记录一些基本的模型信息
                    for i, layer in enumerate(model.layers):
                        tf.summary.text(
                            f"layer_{i}_{layer.name}", 
                            f"类型: {layer.__class__.__name__}, 输出形状: {layer.output_shape}", 
                            step=0
                        )
                    tf.summary.flush()
            except Exception as plot_error:
                logger.error(f"无法绘制模型图: {str(plot_error)}")
                logger.error(traceback.format_exc())
        
        # 生成一些额外的自定义指标
        logger.info("生成额外的可视化指标...")
        metrics_log_dir = os.path.join(log_dir, 'metrics')
        os.makedirs(metrics_log_dir, exist_ok=True)
        
        file_writer = tf.summary.create_file_writer(metrics_log_dir)
        with file_writer.as_default():
            # 添加一些自定义标量
            for i in range(10):
                value = np.random.random()
                tf.summary.scalar('custom_metric', value, step=i)
                
            # 添加一些测试图像
            if len(x_train.shape) == 4 and x_train.shape[3] in [1, 3]:
                # 只对图像数据添加图像摘要
                test_images = x_train[:5]
                tf.summary.image("test_images", test_images, max_outputs=5, step=0)
            
            # 记录模型结构作为文本
            model_summary = []
            model.summary(print_fn=lambda x: model_summary.append(x))
            tf.summary.text("model_summary", "\n".join(model_summary), step=0)
            
            # 添加模型图
            tf.summary.trace_export(
                name="model_trace",
                step=0,
                profiler_outdir=metrics_log_dir
            )
            
            # 确保所有摘要都被写入
            tf.summary.flush()
        
        # 最终检查生成的日志文件
        all_files = []
        for root, dirs, files in os.walk(log_dir):
            for file in files:
                all_files.append(os.path.join(root, file))
        
        logger.info(f"生成的日志文件总数: {len(all_files)}")
        logger.info(f"日志文件列表: {all_files}")
        
        # 创建样本数据点文件，确保TensorBoard能找到一些数据
        sample_data_file = os.path.join(log_dir, 'sample_data.json')
        with open(sample_data_file, 'w') as f:
            sample_data = {
                "model_name": "TensorFlow Model",
                "layers": [layer.name for layer in model.layers],
                "metrics": ["accuracy", "loss"],
                "timestamp": datetime.now().isoformat()
            }
            json.dump(sample_data, f, indent=2)
        
        logger.info("TensorBoard日志生成完成")
        return log_dir
    except Exception as e:
        logger.error(f"生成TensorBoard日志过程中发生错误: {str(e)}")
        logger.error(traceback.format_exc())
        
        # 创建一个最简单的日志文件以确保TensorBoard能找到它
        emergency_log_dir = os.path.join(log_dir, 'emergency')
        os.makedirs(emergency_log_dir, exist_ok=True)
        
        try:
            with tf.summary.create_file_writer(emergency_log_dir).as_default():
                for i in range(10):
                    tf.summary.scalar("emergency_metric", float(i), step=i)
                tf.summary.text("error_message", str(e), step=0)
                tf.summary.flush()
            
            logger.info(f"已创建应急日志文件在: {emergency_log_dir}")
        except Exception as ee:
            logger.error(f"创建应急日志也失败: {str(ee)}")
        
        # 尽管发生错误，仍然返回日志目录
        # 这样TensorBoard至少可以显示任何已生成的日志
        return log_dir

def parse_arguments():
    """处理命令行参数"""
    parser = argparse.ArgumentParser(description='将模型结构转换为TensorBoard可视化')
    parser.add_argument('data_file', help='包含模型结构的JSON文件')
    parser.add_argument('--output-dir', help='TensorBoard日志输出目录')
    return parser.parse_args()

def main():
    """主程序入口"""
    # 解析命令行参数
    args = parse_arguments()
    
    # 加载模型数据
    data_path = args.data_file
    logger.info(f"加载模型数据: {data_path}")
    
    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            model_data = json.load(f)
            
        # 调试：打印接收到的数据结构
        logger.info(f"接收到的数据结构键: {json.dumps(list(model_data.keys()))}")
        logger.info(f"modelStructure长度: {len(model_data.get('modelStructure', []))}")
        logger.info(f"edges长度: {len(model_data.get('edges', []))}")
        
        # 打印完整的数据结构以进行调试
        logger.info("完整的JSON数据:")
        with open(os.path.join(os.path.dirname(__file__), 'debug_data.json'), 'w', encoding='utf-8') as f:
            json.dump(model_data, f, indent=2, ensure_ascii=False)
        logger.info(f"已将完整数据保存到debug_data.json文件中")
        
        # 打印更详细的结构信息
        if 'modelStructure' in model_data and len(model_data['modelStructure']) > 0:
            layer_types = [layer.get('type') for layer in model_data['modelStructure']]
            logger.info(f"层类型: {layer_types}")
            
            # 打印第一个层的配置示例
            first_layer = model_data['modelStructure'][0]
            logger.info(f"第一个层 ({first_layer.get('type')}) 配置: {json.dumps(first_layer.get('config', {}))}")
        else:
            logger.warning("没有找到有效的模型结构数据或结构为空")
        
        if 'edges' in model_data and len(model_data['edges']) > 0:
            logger.info(f"连接示例: {json.dumps(model_data['edges'][0])}")
        else:
            logger.warning("没有找到有效的连接数据或连接为空")
    except json.JSONDecodeError as je:
        logger.error(f"JSON解析错误: {str(je)}")
        logger.error(traceback.format_exc())
        # 尝试读取文件的前100个字符以查看格式问题
        try:
            with open(data_path, 'r', encoding='utf-8') as f:
                content = f.read(200)
                logger.error(f"JSON文件内容前200个字符: {content}")
        except Exception:
            pass
        sys.exit(1)
    except Exception as e:
        logger.error(f"加载JSON数据失败: {str(e)}")
        logger.error(traceback.format_exc())
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
        # 使用指定的输出目录（如果提供）
        log_dir = None
        if args.output_dir:
            # 确保输出目录是绝对路径
            log_dir = os.path.abspath(args.output_dir)
            logger.info(f"使用指定的输出目录: {log_dir}")
        
        log_dir = generate_tensorboard_logs(model, log_dir)
        
        # 创建成功标记文件 - 写入绝对路径
        success_marker = os.path.join(os.path.dirname(log_dir), 'tb_ready.txt')
        with open(success_marker, 'w') as f:
            f.write(os.path.abspath(log_dir))
        
        # 创建一个符号链接到标准logs目录以确保TensorBoard默认可以找到它
        standard_log_dir = os.path.join(os.path.dirname(os.path.dirname(log_dir)), 'logs')
        if not os.path.exists(standard_log_dir):
            try:
                # 在不同操作系统上创建符号链接或副本
                if os.name == 'nt':  # Windows
                    os.makedirs(os.path.dirname(standard_log_dir), exist_ok=True)
                    import shutil
                    if os.path.exists(standard_log_dir):
                        shutil.rmtree(standard_log_dir)
                    shutil.copytree(log_dir, standard_log_dir)
                    logger.info(f"已复制日志目录到标准位置: {standard_log_dir}")
                else:  # Unix/Linux/Mac
                    os.makedirs(os.path.dirname(standard_log_dir), exist_ok=True)
                    os.symlink(log_dir, standard_log_dir)
                    logger.info(f"已创建日志目录符号链接: {log_dir} -> {standard_log_dir}")
            except Exception as link_error:
                logger.error(f"创建标准日志目录链接失败: {str(link_error)}")
        
        logger.info(f"TensorBoard准备就绪，成功标记写入: {success_marker}")
        
        # 输出最终结果，包括所有可能的TensorBoard目录
        logger.info(f"TensorBoard可以通过以下任一目录访问:")
        logger.info(f"1. 实际日志目录: {os.path.abspath(log_dir)}")
        logger.info(f"2. 标准logs目录: {os.path.abspath(standard_log_dir)}")
    except Exception as e:
        logger.error(f"生成TensorBoard日志失败: {str(e)}")
        logger.error(traceback.format_exc())
        sys.exit(1)

if __name__ == "__main__":
    main() 