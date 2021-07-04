import { Projection2d } from '../Projection2d';
import { Container2d, container2dWorldTransform } from '../Container2d';
import { TilingSprite } from '@pixi/sprite-tiling';
import { Program } from '@pixi/core';
import { MeshMaterial } from '@pixi/mesh';
import { Mesh2d } from '../mesh/Mesh2d';
import { SimpleMesh, SimpleRope } from '@pixi/mesh-extras';
import { Container } from '@pixi/display';
import { Sprite } from '@pixi/sprite';
import { Sprite2d } from './Sprite2d';
import { TilingSprite2d } from '../tiling/TilingSprite2d';

function convertTo2d()
{
    if (this.proj) return;
    this.proj = new Projection2d(this.transform);
    this.toLocal = Container2d.prototype.toLocal;
    Object.defineProperty(this, 'worldTransform', {
        get: container2dWorldTransform,
        enumerable: true,
        configurable: true
    });
}

Container.prototype.convertTo2d = convertTo2d;

Sprite.prototype.convertTo2d = function convertTo2d()
{
    if (this.proj) return;
    this.calculateVertices = Sprite2d.prototype.calculateVertices;
    this.calculateTrimmedVertices = Sprite2d.prototype.calculateTrimmedVertices;
    this._calculateBounds = Sprite2d.prototype._calculateBounds;
    this.pluginName = 'batch2d';
    convertTo2d.call(this);
};

Container.prototype.convertSubtreeTo2d = function convertTo2d()
{
    this.convertTo2d();
    for (let i = 0; i < this.children.length; i++)
    {
        this.children[i].convertSubtreeTo2d();
    }
};

SimpleMesh.prototype.convertTo2d
    = SimpleRope.prototype.convertTo2d
        = function convertTo2d()
        {
            if (this.proj) return;
            this.calculateVertices = Mesh2d.prototype.calculateVertices;
            this._renderDefault = Mesh2d.prototype._renderDefault;
            if (this.material.pluginName !== 'batch2d')
            {
                this.material = new MeshMaterial(this.material.texture, {
                    program: Program.from(Mesh2d.defaultVertexShader, Mesh2d.defaultFragmentShader),
                    pluginName: 'batch2d'
                });
            }
            convertTo2d.call(this);
        };

TilingSprite.prototype.convertTo2d = function convertTo2d()
{
    if (this.proj) return;

    this.tileProj = new Projection2d(this.tileTransform);
    this.tileProj.reverseLocalOrder = true;
    this.uvRespectAnchor = true;

    this.calculateTrimmedVertices = Sprite2d.prototype.calculateTrimmedVertices;
    this._calculateBounds = Sprite2d.prototype._calculateBounds;
    this._render = TilingSprite2d.prototype._render;

    this.pluginName = 'tilingSprite2d';
    convertTo2d.call(this);
};
