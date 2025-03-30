import React, { useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';
import { MnistData } from '@/tfjs/data.js'; // 确保路径正确
import useStore from '@/store'; // 确保路径正确

async function showExamples(data) {
  const surface = tfvis.visor().surface({ name: 'Input Data Examples', tab: 'Input Data' });
  const examples = data.nextTestBatch(20);
  const numExamples = examples.xs.shape[0];

  for (let i = 0; i < numExamples; i++) {
    const imageTensor = tf.tidy(() => {
      return examples.xs.slice([i, 0], [1, examples.xs.shape[1]]).reshape([28, 28, 1]);
    });

    const canvas = document.createElement('canvas');
    canvas.width = 28;
    canvas.height = 28;
    canvas.style = 'margin: 4px;';
    await tf.browser.toPixels(imageTensor, canvas);
    surface.drawArea.appendChild(canvas);

    imageTensor.dispose();
  }
}

function getModel(conv2dConfigs, maxPooling2dConfigs, denseConfig) {
  const model = tf.sequential();

  const IMAGE_WIDTH = 28;
  const IMAGE_HEIGHT = 28;
  const IMAGE_CHANNELS = 1;

  // Add layers based on configurations
  conv2dConfigs.forEach((config, index) => {
    if (index === 0) {
      model.add(tf.layers.conv2d({
        inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS],
        ...config
      }));
    } else {
      model.add(tf.layers.conv2d(config));
    }
  });

  maxPooling2dConfigs.forEach((config) => {
    model.add(tf.layers.maxPooling2d(config));
  });

  // Flatten the output
  model.add(tf.layers.flatten());

  // Dense output layer
  model.add(tf.layers.dense(denseConfig));

  // Compile the model
  const optimizer = tf.train.adam();
  model.compile({
    optimizer: optimizer,
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

async function train(model, data, isCsv) {
  const metrics = ['loss', 'val_loss', 'acc', 'val_acc'];
  const container = { name: 'Model Training', tab: 'Model', styles: { height: '1000px' } };
  const fitCallbacks = tfvis.show.fitCallbacks(container, metrics);

  let trainXs, trainYs, testXs, testYs;

  if (isCsv) {
    // Assuming CSV has columns: pixel1, pixel2, ..., pixel784, label
    const pixels = data.map(row => Object.values(row).slice(0, -1).map(Number));
    const labels = data.map(row => Number(row.label));

    const xs = tf.tensor(pixels, [pixels.length, 28, 28, 1]);
    const ys = tf.oneHot(labels, 10);

    // Split into training and testing sets
    const splitIndex = Math.floor(xs.shape[0] * 0.8);
    [trainXs, testXs] = tf.split(xs, [splitIndex, xs.shape[0] - splitIndex]);
    [trainYs, testYs] = tf.split(ys, [splitIndex, ys.shape[0] - splitIndex]);

    xs.dispose();
    ys.dispose();
  } else {
    const BATCH_SIZE = 512;
    const TRAIN_DATA_SIZE = 5500;
    const TEST_DATA_SIZE = 1000;

    [trainXs, trainYs] = tf.tidy(() => {
      const d = data.nextTrainBatch(TRAIN_DATA_SIZE);
      return [
        d.xs.reshape([TRAIN_DATA_SIZE, 28, 28, 1]),
        d.labels
      ];
    });

    [testXs, testYs] = tf.tidy(() => {
      const d = data.nextTestBatch(TEST_DATA_SIZE);
      return [
        d.xs.reshape([TEST_DATA_SIZE, 28, 28, 1]),
        d.labels
      ];
    });
  }

  return model.fit(trainXs, trainYs, {
    batchSize: 512,
    validationData: [testXs, testYs],
    epochs: 10,
    shuffle: true,
    callbacks: fitCallbacks
  }).finally(() => {
    trainXs.dispose();
    trainYs.dispose();
    testXs.dispose();
    testYs.dispose();
  });
}

function TrainButton() {
  const { conv2dConfigs, maxPooling2dConfigs, denseConfig, csvData, isData } = useStore();

  const handleTrainClick = useCallback(async () => {
    let data;
    let isCsv = false;

    if (isData) {
      data = csvData;
      isCsv = true;
    } else {
      data = new MnistData();
      await data.load();
      await showExamples(data);
    }

    const model = getModel(conv2dConfigs, maxPooling2dConfigs, denseConfig);
    tfvis.show.modelSummary({ name: 'Model Architecture', tab: 'Model' }, model);

    await train(model, data, isCsv);
  }, [conv2dConfigs, maxPooling2dConfigs, denseConfig, csvData, isData]);

  return (
    <button 
      onClick={handleTrainClick} 
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
    >
      Train Model
    </button>
  );
}

export default TrainButton;



