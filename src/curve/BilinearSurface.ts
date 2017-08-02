namespace pixi_projection {
	import PointLike = PIXI.PointLike;

	const tempMat = new PIXI.Matrix();
	const tempRect = new PIXI.Rectangle();

	export class BilinearSurface extends Surface {
		distortion = new PIXI.Point();

		constructor() {
			super();
		}

		apply(pos: PointLike, newPos?: PointLike): PointLike {
			newPos = newPos || new PIXI.Point();
			const d = this.distortion;
			newPos.x = pos.x + d.x * (pos.x - 1) * (pos.y - 1);
			newPos.y = pos.y + d.y * (pos.x - 1) * (pos.y - 1);
			return newPos;
		}

		applyInverse(pos: PointLike, newPos: PointLike): PointLike {
			newPos = newPos || new PIXI.Point();
			let dx = this.distortion.x, dy = this.distortion.y;
			newPos.x = pos.x * (dx + 1) / (dx + 1 + pos.y * dy);
			newPos.y = pos.y * (dx + 1) / (dy + 1 + pos.x * dx);
			return newPos;
		}

		mapSprite(sprite: PIXI.Sprite, quad: Array<PointLike>, outTransform?: PIXI.TransformStatic) {
			const tex = sprite.texture;

			tempRect.x = -sprite.anchor.x * tex.orig.width;
			tempRect.y = -sprite.anchor.y * tex.orig.height;
			tempRect.width = tex.orig.width;
			tempRect.height = tex.orig.height;

			return this.mapSprite(sprite, quad, outTransform || sprite.transform as PIXI.TransformStatic);
		}

		mapQuad(rect: PIXI.Rectangle, quad: Array<PointLike>, outTransform: PIXI.TransformStatic) {
			const ax = -rect.x / rect.width;
			const ay = -rect.y / rect.height;

			const ax2 = (1.0 - rect.x) / rect.width;
			const ay2 = (1.0 - rect.y) / rect.height;

			const up1x = (quad[0].x * (1.0 - ax) + quad[1].x * ax);
			const up1y = (quad[0].y * (1.0 - ax) + quad[1].y * ax);
			const up2x = (quad[0].x * (1.0 - ax2) + quad[1].x * ax2);
			const up2y = (quad[0].y * (1.0 - ax2) + quad[1].y * ax2);

			const down1x = (quad[3].x * (1.0 - ax) + quad[2].x * ax);
			const down1y = (quad[3].y * (1.0 - ax) + quad[2].y * ax);
			const down2x = (quad[3].x * (1.0 - ax2) + quad[2].x * ax2);
			const down2y = (quad[3].y * (1.0 - ax2) + quad[2].y * ax2);

			const x00 = up1x * (1.0 - ay) + down1x * ay;
			const y00 = up1y * (1.0 - ay) + down1y * ay;

			const x10 = up2x * (1.0 - ay) + down2x * ay;
			const y10 = up2y * (1.0 - ay) + down2y * ay;

			const x01 = up1x * (1.0 - ay2) + down1x * ay2;
			const y01 = up1y * (1.0 - ay2) + down1y * ay2;

			const x11 = up2x * (1.0 - ay2) + down2x * ay2;
			const y11 = up2y * (1.0 - ay2) + down2y * ay2;

			const mat = tempMat;

			this.distortion.set(x11 - x10 - x01 + x00,
				y11 - y10 - y01 + y00);

			mat.tx = x00;
			mat.ty = y00;
			mat.a = x10 - x00;
			mat.b = y10 - y00;
			mat.c = x01 - x00;
			mat.d = y01 - y00;

			outTransform.setFromMatrix(mat);

			return this;
		}

		fillUniforms(uniforms: any) {
			uniforms.distortion = uniforms.distortion || new Float32Array([0, 0]);
			uniforms.distortion[0] = this.distortion.x;
			uniforms.distortion[1] = this.distortion.y;
		}
	}
}
