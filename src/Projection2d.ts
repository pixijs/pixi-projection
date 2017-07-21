namespace pixi_projection {
	export class Projection2d {
		// store transforms in arrays by column
		localTransform = [1.0, 0, 0, 0, 1, 0, 0, 0, 1];
		worldTransform = [1.0, 0, 0, 0, 1, 0, 0, 0, 1];

		_parentID = -1;
		_worldID = 0;

		updateTransform(parentTransform: PIXI.Transform) {
			const lt = this.localTransform;
			let pid = (parentTransform as any)._worldID;

			if (this._parentID !== pid) {
				// concat the parent matrix with the objects transform.
				const pt = parentTransform.worldTransform;
				const wt = this.worldTransform;

				this._parentID = pid;

				wt[0] = pt.a * lt[0] + pt.c * lt[1] + pt.tx * lt[2];
				wt[1] = pt.b * lt[0] + pt.d * lt[1] + pt.ty * lt[2];
				wt[2] = lt[2];

				wt[3] = pt.a * lt[3] + pt.c * lt[4] + pt.tx * lt[5];
				wt[4] = pt.b * lt[3] + pt.d * lt[4] + pt.ty * lt[5];
				wt[5] = lt[5];

				wt[6] = pt.a * lt[6] + pt.c * lt[7] + pt.tx * lt[8];
				wt[7] = pt.b * lt[6] + pt.d * lt[7] + pt.ty * lt[8];
				wt[8] = lt[8];

				// update the id of the transform..
				this._worldID++;
			}
		}
	}
}
