/// <reference path="../../types.d.ts" />

import { Projection3d } from '../Projection3d';
import { Sprite3d } from './Sprite3d';
import { Text } from '@pixi/text';
import { TRANSFORM_STEP } from '../../constants';
import { 
	container3dToLocal,
	container3dIsFrontFace,
	container3dGetDepth
} from '../Container3d';

import type { DisplayObject } from '@pixi/display';
import type { IEuler } from '../ObservableEuler';
import type { IPoint } from '@pixi/math';
import type { TextStyle } from '@pixi/text';

export class Text3d extends Text {
	constructor(text?: string, style?: TextStyle, canvas?: HTMLCanvasElement) {
		super(text, style, canvas);
		this.proj = new Projection3d(this.transform);
		this.pluginName = 'batch2d';
	}

	proj: Projection3d;
	vertexData2d: Float32Array = null;

	get worldTransform() {
		return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
	}

	toLocal<T extends IPoint>(position: IPoint, from?: DisplayObject,
										point?: T, skipUpdate?: boolean,
										step = TRANSFORM_STEP.ALL): T {
		return container3dToLocal.call(this, position, from, point, skipUpdate, step);
	}

	isFrontFace(forceUpdate?: boolean) {
		return container3dIsFrontFace.call(this, forceUpdate);
	}

	getDepth(forceUpdate?: boolean) {
		return container3dGetDepth.call(this, forceUpdate);
	}

	get position3d(): IPoint {
		return this.proj.position;
	}
	get scale3d(): IPoint {
		return this.proj.scale;
	}
	get euler(): IEuler {
		return this.proj.euler;
	}
	get pivot3d(): IPoint {
		return this.proj.pivot;
	}
	set position3d(value: IPoint) {
		this.proj.position.copyFrom(value);
	}
	set scale3d(value: IPoint) {
		this.proj.scale.copyFrom(value);
	}
	set euler(value: IEuler) {
		this.proj.euler.copyFrom(value);
	}
	set pivot3d(value: IPoint) {
		this.proj.pivot.copyFrom(value);
	}
}

Text3d.prototype.calculateVertices = Sprite3d.prototype.calculateVertices;
(Text3d.prototype as any).calculateTrimmedVertices = Sprite3d.prototype.calculateTrimmedVertices;
(Text3d.prototype as any)._calculateBounds = Sprite3d.prototype._calculateBounds;
(Text3d.prototype as any).containsPoint = Sprite3d.prototype.containsPoint;
(Text3d.prototype as any)._render = Sprite3d.prototype._render;
