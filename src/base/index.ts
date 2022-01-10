import { Renderer } from '@pixi/core';
import { Batch2dPluginFactory } from './webgl/Sprite2dRenderer';

export * from './AbstractProjection';
export * from './LinearProjection';
export * from './webgl/Sprite2dRenderer';
export * from './webgl/UniformBatchRenderer';

Renderer.registerPlugin('batch2d', Batch2dPluginFactory.create({}));
