import { extensions } from '@pixi/core';
import { Batch2dRenderer } from './webgl/Sprite2dRenderer';

export * from './AbstractProjection';
export * from './LinearProjection';
export * from './webgl/Sprite2dRenderer';
export * from './webgl/UniformBatchRenderer';

extensions.add(Batch2dRenderer);
