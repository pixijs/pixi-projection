namespace pixi_projection {
	import MultiTextureSpriteRenderer = pixi_projection.webgl.MultiTextureSpriteRenderer;

	class SpriteBilinearRenderer extends MultiTextureSpriteRenderer {
		size = 100;
		MAX_TEXTURES = 1;

		shaderVert = `precision highp float;
attribute vec2 aVertexPosition;
attribute vec3 aTrans1;
attribute vec3 aTrans2;
attribute vec4 aFrame;
attribute vec4 aColor;
attribute float aTextureId;

uniform mat3 projectionMatrix;
uniform mat3 worldTransform;

varying vec2 vTextureCoord;
varying vec3 vTrans1;
varying vec3 vTrans2;
varying vec4 vFrame;
varying vec4 vColor;
varying float vTextureId;

void main(void){
    gl_Position.xyw = projectionMatrix * worldTransform * vec3(aVertexPosition, 1.0);
    gl_Position.z = 0.0;
    
    vTextureCoord = aVertexPosition;
    vTrans1 = aTrans1;
    vTrans2 = aTrans2;
    vTextureId = aTextureId;
    vColor = aColor;
    vFrame = aFrame;
}
`;
		//TODO: take non-premultiplied case into account

		shaderFrag = `precision highp float;
varying vec2 vTextureCoord;
varying vec3 vTrans1;
varying vec3 vTrans2;
varying vec4 vFrame;
varying vec4 vColor;
varying float vTextureId;

uniform sampler2D uSamplers[%count%];
uniform vec2 samplerSize[%count%]; 
uniform vec2 distortion;

void main(void){
vec3 surface;
surface.x = vTextureCoord.x * (distortion.y + 1.0) / (distortion.y + 1.0 + vTextureCoord.y * distortion.x);
surface.y = vTextureCoord.y * (distortion.x + 1.0) / (distortion.x + 1.0 + vTextureCoord.x * distortion.y);
surface.z = 1.0;

vec3 uvx = vTrans1 * surface, uvy = vTrans1 * surface;

vec2 uv;
uv.x = uvx.x + uvx.y + uvx.z;
uv.y = uvy.x + uvy.y + uvy.z;

vec4 edge;
edge.xy = clamp(uv - vFrame.xy + 0.5, vec2(0.0, 0.0), vec2(1.0, 1.0));
edge.zw = clamp(vFrame.zw - uv + 0.5, vec2(0.0, 0.0), vec2(1.0, 1.0));

float alpha = edge.x * edge.y * edge.z * edge.w;
vec4 rColor = vColor * alpha;

float textureId = floor(vTextureId+0.5);
vec4 color;
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
			this.vertSize = 14;
			this.vertByteSize = this.vertSize * 4;

			const gl = this.renderer.gl;
			const vao = this.renderer.createVao()
				.addIndex(this.indexBuffer)
				.addAttribute(vertexBuffer, attrs.aVertexPosition, gl.FLOAT, false, this.vertByteSize, 0)
				.addAttribute(vertexBuffer, attrs.aTrans1, gl.FLOAT, true, this.vertByteSize, 2 * 4)
				.addAttribute(vertexBuffer, attrs.aTrans2, gl.FLOAT, true, this.vertByteSize, 5 * 4)
				.addAttribute(vertexBuffer, attrs.aFrame, gl.FLOAT, true, this.vertByteSize, 8 * 4)
				.addAttribute(vertexBuffer, attrs.aColor, gl.UNSIGNED_BYTE, true, this.vertByteSize, 12 * 4);

			if (attrs.aTextureId) {
				vao.addAttribute(vertexBuffer, attrs.aTextureId, gl.FLOAT, false, this.vertByteSize, 13 * 4);
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
				float32View[index] = vertexData[i * 2];
				float32View[index + 1] = vertexData[i * 2 + 1];

				float32View[index + 2] = aTrans.a;
				float32View[index + 3] = aTrans.c;
				float32View[index + 4] = aTrans.tx;
				float32View[index + 5] = aTrans.b;
				float32View[index + 6] = aTrans.d;
				float32View[index + 7] = aTrans.ty;

				float32View[index + 8] = uvs.x0;
				float32View[index + 9] = uvs.y0;
				float32View[index + 10] = uvs.x1;
				float32View[index + 11] = uvs.y1;

				float32View[index + 12] = argb;
				float32View[index + 13] = textureId;
				index += 17;
			}
		}
	}

	PIXI.WebGLRenderer.registerPlugin('sprite_bilinear', SpriteBilinearRenderer);
}
