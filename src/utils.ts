namespace pixi_projection.utils {
	import PointLike = PIXI.PointLike;

	export function getIntersectionFactor(p1: PIXI.IPoint, p2: PointLike, p3: PointLike, p4: PointLike, out: PointLike): number {
		let A1 = p2.x - p1.x, B1 = p3.x - p4.x, C1 = p3.x - p1.x;
		let A2 = p2.y - p1.y, B2 = p3.y - p4.y, C2 = p3.y - p1.y;
		let D = A1 * B2 - A2 * B1;
		if (Math.abs(D) < 1e-7) {
			out.x = A1;
			out.y = A2;
			return 0;
		}
		let T = C1 * B2 - C2 * B1;
		let U = A1 * C2 - A2 * C1;

		let t = T / D, u = U / D;
		if (u < (1e-6) || u - 1 > -1e-6) {
			return -1;
		}

		out.x = p1.x + t * (p2.x - p1.x);
		out.y = p1.y + t * (p2.y - p1.y);

		return 1;
	}

	export function getPositionFromQuad(p: Array<PointLike>, anchor: PointLike, out: PointLike) {
		out = out || new PIXI.Point();
		let a1 = 1.0 - anchor.x, a2 = 1.0 - a1;
		let b1 = 1.0 - anchor.y, b2 = 1.0 - b1;
		out.x = (p[0].x * a1 + p[1].x * a2) * b1 + (p[3].x * a1 + p[2].x * a2) * b2;
		out.y = (p[0].y * a1 + p[1].y * a2) * b1 + (p[3].y * a1 + p[2].y * a2) * b2;
		return out;
	}
}
