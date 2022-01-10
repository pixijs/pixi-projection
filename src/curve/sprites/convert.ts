import { Sprite } from '@pixi/sprite';
import { Container } from '@pixi/display';
import { Matrix } from '@pixi/math';
import { Sprite2s } from './Sprite2s';
import { ProjectionSurface } from '../ProjectionSurface';

Sprite.prototype.convertTo2s = function spriteConvertTo2s()
{
    if (this.proj) return;
    // container
    this.pluginName = 'sprite_bilinear';
    this.aTrans = new Matrix();
    this.calculateVertices = Sprite2s.prototype.calculateVertices;
    this.calculateTrimmedVertices = Sprite2s.prototype.calculateTrimmedVertices;
    this._calculateBounds = Sprite2s.prototype._calculateBounds;
    Container.prototype.convertTo2s.call(this);
};

Container.prototype.convertTo2s = function convertTo2s()
{
    if (this.proj) return;
    this.proj = new ProjectionSurface(this.transform);
    Object.defineProperty(this, 'worldTransform', {
        get()
        {
            return this.proj;
        },
        enumerable: true,
        configurable: true
    });
};

Container.prototype.convertSubtreeTo2s = function convertSubtreeTo2s()
{
    this.convertTo2s();
    for (let i = 0; i < this.children.length; i++)
    {
        this.children[i].convertSubtreeTo2s();
    }
};
