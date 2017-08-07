namespace pixi_projection {
	import MultiTextureSpriteRenderer = pixi_projection.webgl.MultiTextureSpriteRenderer;

	class SpriteBilinearRenderer extends MultiTextureSpriteRenderer {
		size = 100;
		MAX_TEXTURES_LOCAL = 1;

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
vec2 surface;
vec2 surface2;

float vx = vTextureCoord.x;
float vy = vTextureCoord.y;
float dx = distortion.x;
float dy = distortion.y;

if (distortion.x == 0.0) {
    surface.x = vx;
    surface.y = vy / (1.0 + dy * vx);
    surface2 = surface;
} else
if (distortion.y == 0.0) {
    surface.y = vy;
    surface.x = vx/ (1.0 + dx * vy);
    surface2 = surface;
} else {
    float b = (vy * dx - vx * dy + 1.0) * 0.5;
    float d = b * b + vx * dy;

    if (d < -0.00001) {
        discard;
    }
    if (d < 0.0) {
        d = 0.0;
    }
  	surface.x = (- b + sqrt(d)) / dy;
   	surface2.x = (- b - sqrt(d)) / dy;
    
    float b2 = (vx * dy - vy * dx + 1.0) * 0.5;
    float d2 = b2 * b2 + vy * dx;

    if (d2 < -0.00001) {
        discard;
    }
    if (d2 < 0.0) {
        d2 = 0.0;
    }
  	surface.y = (- b2 + sqrt(d2)) / dx;
   	surface2.y = (- b2 - sqrt(d2)) / dx;
}

vec2 uv;
uv.x = vTrans1.x * surface.x + vTrans1.y * surface.y + vTrans1.z;
uv.y = vTrans2.x * surface.x + vTrans2.y * surface.y + vTrans2.z;

vec2 pixels = uv * samplerSize[0];

if (pixels.x < vFrame.x || pixels.x > vFrame.z ||
    pixels.y < vFrame.y || pixels.y > vFrame.w) {
	uv.x = vTrans1.x * surface2.x + vTrans1.y * surface2.y + vTrans1.z;
	uv.y = vTrans2.x * surface2.x + vTrans2.y * surface2.y + vTrans2.z;
	pixels = uv * samplerSize[0];
	
	if (pixels.x < vFrame.x || pixels.x > vFrame.z ||
        pixels.y < vFrame.y || pixels.y > vFrame.w) {
        discard;
    }
}

vec4 edge;
edge.xy = clamp(pixels - vFrame.xy + 0.5, vec2(0.0, 0.0), vec2(1.0, 1.0));
edge.zw = clamp(vFrame.zw - pixels + 0.5, vec2(0.0, 0.0), vec2(1.0, 1.0));

float alpha = 1.0; //edge.x * edge.y * edge.z * edge.w;
vec4 rColor = vColor * alpha;

float textureId = floor(vTextureId+0.5);
vec4 color;
vec2 textureCoord = uv;
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
				.addAttribute(vertexBuffer, attrs.aTrans1, gl.FLOAT, false, this.vertByteSize, 2 * 4)
				.addAttribute(vertexBuffer, attrs.aTrans2, gl.FLOAT, false, this.vertByteSize, 5 * 4)
				.addAttribute(vertexBuffer, attrs.aFrame, gl.FLOAT, false, this.vertByteSize, 8 * 4)
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
			const frame = tex._frame;
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

				float32View[index + 8] = frame.x;
				float32View[index + 9] = frame.y;
				float32View[index + 10] = frame.x + frame.width;
				float32View[index + 11] = frame.y + frame.height;

				uint32View[index + 12] = argb;
				float32View[index + 13] = textureId;
				index += 14;
			}
		}
	}

	PIXI.WebGLRenderer.registerPlugin('sprite_bilinear', SpriteBilinearRenderer);
}
