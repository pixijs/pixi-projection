namespace pixi_projection {
	import MultiTextureSpriteRenderer = pixi_projection.webgl.MultiTextureSpriteRenderer;

	class SpriteBilinearRenderer extends MultiTextureSpriteRenderer {
		shaderVert = `precision highp float;
attribute vec2 aVertexPosition;
attribute mat3 aTrans;
attribute vec4 frame;
attribute vec4 aColor;
attribute float aTextureId;

uniform mat3 projectionMatrix;
uniform mat3 worldTransform;

varying vec2 vTextureCoord;
varying mat3 vTrans;
varying vec4 vFrame;
varying vec4 vColor;
varying float vTextureId;

void main(void){
    gl_Position.xyw = projectionMatrix * worldTransform * vec3(aVertexPosition, 1.0);
    gl_Position.z = 0.0;
    
    vTextureCoord = aVertexPosition;
    vTrans = aTrans;
    vTextureId = aTextureId;
    vColor = aColor;
    vFrame = aFrame;
}
`;
		//TODO: take non-premultiplied case into account

		shaderFrag = `precision highp float;
varying vec2 vTextureCoord;
varying mat3 vTrans;
varying vec4 vFrame;
varying vec4 vColor;
varying float vTextureId;

uniform sampler2D uSamplers[%count%];
uniform vec2 samplesSize[%count%]; 
uniform vec2 distortion;

void main(void){
vec3 surface;
surface.x = vTextureCoord.x * (distortion.y + 1) / (distortion.y + 1 + vTextureCoord.y * distortion.x);
surface.y = vTextureCoord.y * (distortion.x + 1) / (distortion.x + 1 + vTextureCoord.x * distortion.y);
surface.z = 1;

vec2 uv = (vTrans * surface).xy;

vec4 clamp;
clamp.xy = clamp(uv - frame.xy + 0.5, vec2(0.0, 0.0), vec2(1.0, 1.0));
clamp.zw = clamp(frame.zy - uv + 0.5, vec2(0.0, 0.0), vec2(1.0, 1.0));

float alpha = clamp.x * clamp.y * clamp.z * clamp.w;
vec4 rColor = vColor * alpha;

float textureId = floor(vTextureId+0.5);
%forloop%
gl_FragColor = color * rColor;
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

	// PIXI.WebGLRenderer.registerPlugin('sprite_bilinear', SpriteBilinearRenderer);
}