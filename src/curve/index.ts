import { Renderer } from '@pixi/core';
import { BatchBilinearPluginFactory } from './SpriteBilinearRenderer';

export * from './BaseSurface';
export * from './BilinearSurface';
export * from './ProjectionSurface';
export * from './SpriteBilinearRenderer';

export * from './sprites/convert';
export * from './sprites/Sprite2s';
export * from './sprites/Text2s';

Renderer.registerPlugin('batch_bilinear', BatchBilinearPluginFactory.create({}));
