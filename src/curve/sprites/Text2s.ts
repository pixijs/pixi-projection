/// <reference path="../../types.d.ts" />

import { ProjectionSurface } from '../ProjectionSurface';
import { Sprite2s } from './Sprite2s';
import { Text, TextStyle } from '@pixi/text';

export class Text2s extends Text {
	constructor(text?: string, style?: TextStyle, canvas?: HTMLCanvasElement) {
		super(text, style, canvas);
		this.proj = new ProjectionSurface(this.transform);
		this.pluginName = 'batch_bilinear';
	}

	proj: ProjectionSurface;

	aTrans = new PIXI.Matrix();

	get worldTransform() {
		return this.proj as any;
	}
}

(Text2s.prototype as any).calculateVertices = Sprite2s.prototype.calculateVertices;
(Text2s.prototype as any).calculateTrimmedVertices = Sprite2s.prototype.calculateTrimmedVertices;
(Text2s.prototype as any)._calculateBounds = Sprite2s.prototype._calculateBounds;

