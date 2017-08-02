namespace pixi_projection {
	import MultiTextureSpriteRenderer = pixi_projection.webgl.MultiTextureSpriteRenderer;

	class Sprite2dRenderer extends MultiTextureSpriteRenderer {
		shaderVert =
`precision highp float;
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aColor;
attribute float aTextureId;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;

void main(void){
    gl_Position.xyw = projectionMatrix * aVertexPosition;
    gl_Position.z = 0.0;
    
    vTextureCoord = aTextureCoord;
    vTextureId = aTextureId;
    vColor = aColor;
}
`;
		shaderFrag = `
varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;
uniform sampler2D uSamplers[%count%];

void main(void){
vec4 color;
vec2 textureCoord = vTextureCoord;
float textureId = floor(vTextureId+0.5);
%forloop%
gl_FragColor = color * vColor;
}`;

		createVao(vertexBuffer: PIXI.glCore.GLBuffer) {
			const attrs = this.shader.attributes;
			this.vertSize = 6;
			this.vertByteSize = this.vertSize * 4;

			const gl = this.renderer.gl;
			const vao = this.renderer.createVao()
				.addIndex(this.indexBuffer)
				.addAttribute(vertexBuffer, attrs.aVertexPosition, gl.FLOAT, false, this.vertByteSize, 0)
				.addAttribute(vertexBuffer, attrs.aTextureCoord, gl.UNSIGNED_SHORT, true, this.vertByteSize, 3 * 4)
				.addAttribute(vertexBuffer, attrs.aColor, gl.UNSIGNED_BYTE, true, this.vertByteSize, 4 * 4);

			if (attrs.aTextureId) {
				vao.addAttribute(vertexBuffer, attrs.aTextureId, gl.FLOAT, false, this.vertByteSize, 5 * 4);
			}

			return vao;

		}

		fillVertices(float32View: Float32Array, uint32View: Uint32Array, index: number, sprite: any, argb: number, textureId: number) {
			const vertexData = sprite.vertexData;
			const uvs = sprite._texture._uvs.uvsUint32;
			if (vertexData.length === 8) {
				//PIXI standart sprite
				if (this.renderer.roundPixels) {
					const resolution = this.renderer.resolution;

					float32View[index] = ((vertexData[0] * resolution) | 0) / resolution;
					float32View[index + 1] = ((vertexData[1] * resolution) | 0) / resolution;
					float32View[index + 2] = 1.0;

					float32View[index + 6] = ((vertexData[2] * resolution) | 0) / resolution;
					float32View[index + 7] = ((vertexData[3] * resolution) | 0) / resolution;
					float32View[index + 8] = 1.0;

					float32View[index + 12] = ((vertexData[4] * resolution) | 0) / resolution;
					float32View[index + 13] = ((vertexData[5] * resolution) | 0) / resolution;
					float32View[index + 14] = 1.0;

					float32View[index + 18] = ((vertexData[6] * resolution) | 0) / resolution;
					float32View[index + 19] = ((vertexData[7] * resolution) | 0) / resolution;
					float32View[index + 20] = 1.0;
				}
				else {
					float32View[index] = vertexData[0];
					float32View[index + 1] = vertexData[1];
					float32View[index + 2] = 1.0;

					float32View[index + 6] = vertexData[2];
					float32View[index + 7] = vertexData[3];
					float32View[index + 8] = 1.0;

					float32View[index + 12] = vertexData[4];
					float32View[index + 13] = vertexData[5];
					float32View[index + 14] = 1.0;

					float32View[index + 18] = vertexData[6];
					float32View[index + 19] = vertexData[7];
					float32View[index + 20] = 1.0;
				}
			} else {
				// projective 2d/3d sprite

				// I removed roundPixels, dont need that for those kind of sprites

				float32View[index] = vertexData[0];
				float32View[index + 1] = vertexData[1];
				float32View[index + 2] = vertexData[2];

				float32View[index + 6] = vertexData[3];
				float32View[index + 7] = vertexData[4];
				float32View[index + 8] = vertexData[5];

				float32View[index + 12] = vertexData[6];
				float32View[index + 13] = vertexData[7];
				float32View[index + 14] = vertexData[8];

				float32View[index + 18] = vertexData[9];
				float32View[index + 19] = vertexData[10];
				float32View[index + 20] = vertexData[11];
			}

			uint32View[index + 3] = uvs[0];
			uint32View[index + 9] = uvs[1];
			uint32View[index + 15] = uvs[2];
			uint32View[index + 21] = uvs[3];

			uint32View[index + 4] = uint32View[index + 10] = uint32View[index + 16] = uint32View[index + 22] = argb;
			float32View[index + 5] = float32View[index + 11] = float32View[index + 17] = float32View[index + 23] = textureId;
		}
	}

	PIXI.WebGLRenderer.registerPlugin('sprite2d', Sprite2dRenderer);
}