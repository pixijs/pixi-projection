import { extensions } from '@pixi/core';
import { BatchBilinearRenderer } from './SpriteBilinearRenderer';

export * from './BaseSurface';
export * from './BilinearSurface';
export * from './ProjectionSurface';
export * from './SpriteBilinearRenderer';

export * from './sprites/convert';
export * from './sprites/Sprite2s';
export * from './sprites/Text2s';

extensions.add(BatchBilinearRenderer);
