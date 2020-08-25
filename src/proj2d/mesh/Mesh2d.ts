/// <reference path="../../types.d.ts" />

import { container2dToLocal } from '../Container2d';
import { DRAW_MODES } from '@pixi/constants';
import { Geometry, Shader, State } from '@pixi/core';
import { Projection2d } from '../Projection2d';
import { TRANSFORM_STEP } from '../../constants';
import defaultVertexShader from './mesh2d-default.vert';
import defaultFragmentShader from './mesh2d-default.frag';

export class Mesh2d extends PIXI.Mesh {
	static defaultVertexShader = defaultVertexShader;
	static defaultFragmentShader = defaultFragmentShader;

	constructor(geometry: Geometry, shader: Shader, state: State, drawMode?: DRAW_MODES)
	{
		super(geometry, shader, state, drawMode);
		this.proj = new Projection2d(this.transform);
	}

	vertexData2d: Float32Array = null;
	proj: Projection2d;

	calculateVertices()
	{
		if (this.proj._affine) {
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

		const wt = this.proj.world.mat3;

		const vertexData2d = this.vertexData2d;
		const vertexData = thisAny.vertexData;

		for (let i = 0; i < vertexData.length / 2; i++)
		{
			const x = vertices[(i * 2)];
			const y = vertices[(i * 2) + 1];

			const xx = (wt[0] * x) + (wt[3] * y) + wt[6];
			const yy = (wt[1] * x) + (wt[4] * y) + wt[7];
			const ww = (wt[2] * x) + (wt[5] * y) + wt[8];

			vertexData2d[i * 3] = xx;
			vertexData2d[i * 3 + 1] = yy;
			vertexData2d[i * 3 + 2] = ww;

			vertexData[(i * 2)] = xx / ww;
			vertexData[(i * 2) + 1] = yy / ww;
		}

		thisAny.vertexDirty = geometry.vertexDirtyId;
	}

	_renderDefault(renderer: PIXI.Renderer) {
		const shader = this.shader as PIXI.MeshMaterial;

		shader.alpha = this.worldAlpha;
		if (shader.update)
		{
			shader.update();
		}

		renderer.batch.flush();

		if ((shader as any).program.uniformData.translationMatrix)
		{
			shader.uniforms.translationMatrix = this.worldTransform.toArray(true);
		}

		// bind and sync uniforms..
		renderer.shader.bind(shader, false);

		// set state..
		renderer.state.set(this.state);

		// bind the geometry...
		renderer.geometry.bind(this.geometry, shader);

		// then render it
		renderer.geometry.draw(this.drawMode, this.size, this.start, (this.geometry as any).instanceCount);
	}

	toLocal<T extends PIXI.IPoint>(position: PIXI.IPoint, from?: PIXI.DisplayObject,
									point?: T, skipUpdate?: boolean,
									step = TRANSFORM_STEP.ALL): T {
		return container2dToLocal.call(this, position, from, point, skipUpdate, step);
	}

	get worldTransform() {
		return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
	}
}

export class SimpleMesh2d extends Mesh2d {
	constructor(texture: PIXI.Texture, vertices?: Float32Array, uvs?: Float32Array,
				indices?: Uint16Array, drawMode?: number) {
		super(new PIXI.MeshGeometry(vertices, uvs, indices),
			new PIXI.MeshMaterial(texture, {
				program: PIXI.Program.from(Mesh2d.defaultVertexShader, Mesh2d.defaultFragmentShader),
				pluginName: 'batch2d'
			}),
			null,
			drawMode);

		(this.geometry.getBuffer('aVertexPosition') as any).static = false;
	}

	autoUpdate = true;

	get vertices()
	{
		return this.geometry.getBuffer('aVertexPosition').data as Float32Array;
	}
	set vertices(value)
	{
		this.geometry.getBuffer('aVertexPosition').data = value;
	}

	protected _render(renderer?: PIXI.Renderer)
	{
		if (this.autoUpdate)
		{
			this.geometry.getBuffer('aVertexPosition').update();
		}

		(super._render as any)(renderer);
	}
}
