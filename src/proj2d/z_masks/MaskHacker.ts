import { MaskData, MaskSystem } from '@pixi/core';
import type { Sprite } from '@pixi/sprite';
import { SpriteMaskFilter2d } from './SpriteMaskFilter';

const oldPushSpriteMask = MaskSystem.prototype.pushSpriteMask;

function pushSpriteMaskOverride(maskData: MaskData): void
{
    const { maskObject } = maskData;
    const origFilter = maskData._filters;

    if (!origFilter)
    {
        let alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex];

        if (!alphaMaskFilter)
        {
            alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex] = [new SpriteMaskFilter2d(maskObject as Sprite)];
        }
        maskData._filters = alphaMaskFilter;
    }
    oldPushSpriteMask.call(this, maskData);
    if (!origFilter)
    {
        maskData._filters = null;
    }
}

export function patchSpriteMask()
{
    MaskSystem.prototype.pushSpriteMask = pushSpriteMaskOverride;
}
