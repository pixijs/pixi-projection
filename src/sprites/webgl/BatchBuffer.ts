namespace pixi_projection.webgl {
	export class BatchBuffer {
		vertices: ArrayBuffer;
		float32View: Float32Array;
		uint32View: Uint32Array;


		constructor(size: number) {
			this.vertices = new ArrayBuffer(size);

			/**
			 * View on the vertices as a Float32Array for positions
			 *
			 * @member {Float32Array}
			 */
			this.float32View = new Float32Array(this.vertices);

			/**
			 * View on the vertices as a Uint32Array for uvs
			 *
			 * @member {Float32Array}
			 */
			this.uint32View = new Uint32Array(this.vertices);
		}

		/**
		 * Destroys the buffer.
		 *
		 */
		destroy() {
			this.vertices = null;
		}
	}
}
