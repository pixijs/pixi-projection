namespace pixi_projection {
	import MultiTextureSpriteRenderer = pixi_projection.webgl.MultiTextureSpriteRenderer;

	class SpriteBilinearRenderer extends MultiTextureSpriteRenderer {
		shaderVert = `precision highp float;
attribute vec2 aVertexPosition;
attribute mat3 aTrans;
attribute vec4 aFrame;
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

		defUniforms = {
			worldTransform: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),
			distortion: new Float32Array([0, 0])
		};

		getUniforms(sprite: PIXI.Sprite) {
			let proj = (sprite as Sprite2s).proj;
			let shader = this.shader;

			if (proj.surface !== null) {
				return proj.uniforms;
			}
			if (proj._activeProjection !== null) {
				return proj._activeProjection.uniforms;
			}
			return this.defUniforms;
		}

		createVao(vertexBuffer: PIXI.glCore.GLBuffer) {
			const attrs = this.shader.attributes;
			this.vertSize = 17;
			this.vertByteSize = this.vertSize * 4;

			const gl = this.renderer.gl;
			const vao = this.renderer.createVao()
				.addIndex(this.indexBuffer)
				.addAttribute(vertexBuffer, attrs.aVertexPosition, gl.FLOAT, false, this.vertByteSize, 0)
				.addAttribute(vertexBuffer, attrs.aTrans, gl.FLOAT, true, this.vertByteSize, 2 * 4)
				.addAttribute(vertexBuffer, attrs.aFrame, gl.FLOAT, true, this.vertByteSize, 11 * 4)
				.addAttribute(vertexBuffer, attrs.aColor, gl.UNSIGNED_BYTE, true, this.vertByteSize, 15 * 4);

			if (attrs.aTextureId) {
				vao.addAttribute(vertexBuffer, attrs.aTextureId, gl.FLOAT, false, this.vertByteSize, 16 * 4);
			}

			return vao;

		}

		fillVertices(float32View: Float32Array, uint32View: Uint32Array, index: number, sprite: any, argb: number, textureId: number) {
			const vertexData = sprite.vertexData;
			const tex = sprite._texture;
			const w = tex.orig.width;
			const h = tex.orig.height;
			const ax = sprite._anchor._x;
			const ay = sprite._anchor._y;
			const uvs = tex._uvs;
			const aTrans = sprite.aTrans;

			for (let i = 0; i < 4; i++) {
				index += 17;
				float32View[index] = vertexData[i * 2];
				float32View[index + 1] = vertexData[i * 2 + 1];

				float32View[index + 2] = aTrans.a;
				float32View[index + 3] = aTrans.b;
				float32View[index + 4] = 0;
				float32View[index + 5] = aTrans.c;
				float32View[index + 6] = aTrans.d;
				float32View[index + 7] = 0;
				float32View[index + 8] = aTrans.tx;
				float32View[index + 9] = aTrans.ty;
				float32View[index + 10] = 0;

				float32View[index + 11] = uvs.x0;
				float32View[index + 12] = uvs.y0;
				float32View[index + 13] = uvs.x1;
				float32View[index + 14] = uvs.y1;

				float32View[index + 15] = argb;
				float32View[index + 16] = textureId;
			}
		}
	}

	// PIXI.WebGLRenderer.registerPlugin('sprite_bilinear', SpriteBilinearRenderer);
}
