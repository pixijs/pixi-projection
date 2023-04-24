import { extensions } from '@pixi/core';
import { TilingSprite2dRenderer } from './tiling/TilingSprite2dRenderer';

export * from './Matrix2d';
export * from './Projection2d';
export * from './Container2d';

export * from './sprites/convert';
export * from './sprites/Sprite2d';
export * from './sprites/Text2d';

export * from './tiling/TilingSprite2d';
export * from './tiling/TilingSprite2dRenderer';

export * from './z_masks/MaskHacker';
export * from './z_masks/SpriteMaskFilter';

export * from './mesh/Mesh2d';

extensions.add(TilingSprite2dRenderer);
