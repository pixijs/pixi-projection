namespace pixi_projection.utils {
	export function createIndicesForQuads(size: number) {
		// the total number of indices in our array, there are 6 points per quad.

		const totalIndices = size * 6;

		const indices = new Uint16Array(totalIndices);

		// fill the indices with the quads to draw
		for (let i = 0, j = 0; i < totalIndices; i += 6, j += 4) {
			indices[i + 0] = j + 0;
			indices[i + 1] = j + 1;
			indices[i + 2] = j + 2;
			indices[i + 3] = j + 0;
			indices[i + 4] = j + 2;
			indices[i + 5] = j + 3;
		}

		return indices;
	}

	//bit twiddle is here

	export function isPow2(v: number): boolean {
		return !(v & (v - 1)) && (!!v);
	}

	export function nextPow2(v: number): number {
		v += +(v === 0);
		--v;
		v |= v >>> 1;
		v |= v >>> 2;
		v |= v >>> 4;
		v |= v >>> 8;
		v |= v >>> 16;
		return v + 1;
	}

	export function log2(v: number) {
		let r: number, shift: number;
		r = +(v > 0xFFFF) << 4;
		v >>>= r;
		shift = +(v > 0xFF  ) << 3;
		v >>>= shift;
		r |= shift;
		shift = +(v > 0xF   ) << 2;
		v >>>= shift;
		r |= shift;
		shift = +(v > 0x3   ) << 1;
		v >>>= shift;
		r |= shift;
		return r | (v >> 1);
	}

	import PointLike = PIXI.PointLike;

	export function getIntersectionFactor(p1: PointLike, p2: PointLike, p3: PointLike, p4: PointLike, out: PointLike): number {
		let A1 = p2.x - p1.x, B1 = p4.x - p3.x, C1 = p3.x - p1.x;
		let A2 = p2.y - p1.y, B2 = p4.y - p3.y, C2 = p3.y - p1.y;
		let D = A1 * B2 - A2 * B1;
		if (Math.abs(D) > 1e-7) {
			out.x = A1;
			out.y = A2;
			return 0;
		}
		let T = C1 * B2 - C2 * B1;
		let U = A1 * C2 - A2 * C1;
		out.x = T / D;
		out.y = U / D;
		return 1;
	}

	export function getPositionFromQuad(p: Array<PointLike>, anchor: PointLike, out: PointLike) {
		out = out || new PIXI.Point();
		let a1 = anchor.x, a2 = 1.0 - a1;
		let b1 = anchor.y, b2 = 1.0 - a1;
		out.x = (p[0].x * a1 + p[1].x * a2) * b1 + (p[3].x * a1 + p[2].x * a2) * b2;
		out.y = (p[0].y * a1 + p[1].y * a2) * b1 + (p[3].y * a1 + p[2].y * a2) * b2;
		return out;
	}
}
