import { Mesh, MeshGeometry, MeshMaterial } from '@pixi/mesh';
import { Geometry, Program, Renderer, State, Texture } from '@pixi/core';
import { Projection3d } from '../Projection3d';
import { IPointData, Matrix } from '@pixi/math';
import { DisplayObject } from '@pixi/display';
import { TRANSFORM_STEP } from '../../base';
import { container3dGetDepth, container3dIsFrontFace, container3dToLocal } from '../Container3d';
import { Euler } from '../Euler';
import { Mesh2d } from '../../proj2d';

export class Mesh3d2d extends Mesh
{
    constructor(geometry: Geometry, shader: MeshMaterial, state: State, drawMode?: number)
    {
        super(geometry, shader, state, drawMode);
        this.proj = new Projection3d(this.transform);
    }

    vertexData2d: Float32Array = null;
    proj: Projection3d;

    calculateVertices(): void
    {
        if (this.proj._affine)
        {
            this.vertexData2d = null;
            super.calculateVertices();

            return;
        }

        const geometry = this.geometry as any;
        const vertices = geometry.buffers[0].data;
        const thisAny = this as any;

        if (geometry.vertexDirtyId === thisAny.vertexDirty && thisAny._transformID === thisAny.transform._worldID)
        {
            return;
        }

        thisAny._transformID = thisAny.transform._worldID;

        if (thisAny.vertexData.length !== vertices.length)
        {
            thisAny.vertexData = new Float32Array(vertices.length);
        }
        if (!this.vertexData2d || this.vertexData2d.length !== vertices.length * 3 / 2)
        {
            this.vertexData2d = new Float32Array(vertices.length * 3);
        }

        const wt = this.proj.world.mat4;

        const vertexData2d = this.vertexData2d;
        const vertexData = thisAny.vertexData;

        for (let i = 0; i < vertexData.length / 2; i++)
        {
            const x = vertices[(i * 2)];
            const y = vertices[(i * 2) + 1];

            const xx = (wt[0] * x) + (wt[4] * y) + wt[12];
            const yy = (wt[1] * x) + (wt[5] * y) + wt[13];
            const ww = (wt[3] * x) + (wt[7] * y) + wt[15];

            vertexData2d[i * 3] = xx;
            vertexData2d[(i * 3) + 1] = yy;
            vertexData2d[(i * 3) + 2] = ww;

            vertexData[(i * 2)] = xx / ww;
            vertexData[(i * 2) + 1] = yy / ww;
        }

        thisAny.vertexDirty = geometry.vertexDirtyId;
    }

    get worldTransform(): Matrix
    {
        return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
    }

    toLocal<T extends IPointData>(position: IPointData, from?: DisplayObject,
        point?: T, skipUpdate?: boolean,
        step = TRANSFORM_STEP.ALL): T
    {
        return container3dToLocal.call(this, position, from, point, skipUpdate, step);
    }

    isFrontFace(forceUpdate?: boolean): boolean
    {
        return container3dIsFrontFace.call(this, forceUpdate);
    }

    getDepth(forceUpdate?: boolean): boolean
    {
        return container3dGetDepth.call(this, forceUpdate);
    }

    get position3d(): IPointData
    {
        return this.proj.position;
    }
    set position3d(value: IPointData)
    {
        this.proj.position.copyFrom(value);
    }
    get scale3d(): IPointData
    {
        return this.proj.scale;
    }
    set scale3d(value: IPointData)
    {
        this.proj.scale.copyFrom(value);
    }
    get euler(): Euler
    {
        return this.proj.euler;
    }
    set euler(value: Euler)
    {
        this.proj.euler.copyFrom(value);
    }
    get pivot3d(): IPointData
    {
        return this.proj.pivot;
    }
    set pivot3d(value: IPointData)
    {
        this.proj.pivot.copyFrom(value);
    }
}

(Mesh3d2d.prototype as any)._renderDefault = Mesh2d.prototype._renderDefault;

export class SimpleMesh3d2d extends Mesh3d2d
{
    constructor(texture: Texture, vertices?: Float32Array, uvs?: Float32Array,
        indices?: Uint16Array, drawMode?: number)
    {
        super(new MeshGeometry(vertices, uvs, indices),
            new MeshMaterial(texture, {
                program: Program.from(Mesh2d.defaultVertexShader, Mesh2d.defaultFragmentShader),
                pluginName: 'batch2d'
            }),
            null,
            drawMode);

        (this.geometry.getBuffer('aVertexPosition') as any).static = false;
    }

    autoUpdate = true;

    get vertices(): Float32Array
    {
        return this.geometry.getBuffer('aVertexPosition').data as Float32Array;
    }
    set vertices(value: Float32Array)
    {
        this.geometry.getBuffer('aVertexPosition').data = value;
    }

    protected _render(renderer?: Renderer): void
    {
        if (this.autoUpdate)
        {
            this.geometry.getBuffer('aVertexPosition').update();
        }

        (super._render as any)(renderer);
    }
}
