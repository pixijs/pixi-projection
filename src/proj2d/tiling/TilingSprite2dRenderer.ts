namespace pixi_projection {
	let shaderVert =
		`attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform mat3 uTransform;

varying vec3 vTextureCoord;

void main(void)
{
    gl_Position.xyw = projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0);

    vTextureCoord = uTransform * vec3(aTextureCoord, 1.0);
}
`;
	let shaderFrag = `
varying vec3 vTextureCoord;

uniform sampler2D uSampler;
uniform vec4 uColor;
uniform mat3 uMapCoord;
uniform vec4 uClampFrame;
uniform vec2 uClampOffset;

void main(void)
{
    vec2 coord = mod(vTextureCoord.xy / vTextureCoord.z - uClampOffset, vec2(1.0, 1.0)) + uClampOffset;
    coord = (uMapCoord * vec3(coord, 1.0)).xy;
    coord = clamp(coord, uClampFrame.xy, uClampFrame.zw);

    vec4 sample = texture2D(uSampler, coord);
    gl_FragColor = sample * uColor;
}
`;
	let shaderSimpleFrag = `
	varying vec3 vTextureCoord;

uniform sampler2D uSampler;
uniform vec4 uColor;

void main(void)
{
    vec4 sample = texture2D(uSampler, vTextureCoord.xy / vTextureCoord.z);
    gl_FragColor = sample * uColor;
}
`;

	const tempMat = new PIXI.Matrix();
	import WRAP_MODES = PIXI.WRAP_MODES;
	import utils = PIXI.utils;

	export class TilingSprite2dRenderer extends PIXI.extras.TilingSpriteRenderer {

		shader: PIXI.Shader;
		simpleShader: PIXI.Shader;
		quad: PIXI.Quad;

		onContextChange()
		{
			const gl = this.renderer.gl;

			this.shader = new PIXI.Shader(gl, shaderVert, shaderFrag);
			this.simpleShader = new PIXI.Shader(gl, shaderVert, shaderSimpleFrag);

			this.renderer.bindVao(null);
			this.quad = new (PIXI.Quad as any)(gl, this.renderer.state.attribState);
			this.quad.initVao(this.shader);
		}

		render(ts: any)
		{
			const renderer = this.renderer;
			const quad = this.quad;

			renderer.bindVao(quad.vao);

			let vertices = quad.vertices;

			vertices[0] = vertices[6] = (ts._width) * -ts.anchor.x;
			vertices[1] = vertices[3] = ts._height * -ts.anchor.y;

			vertices[2] = vertices[4] = (ts._width) * (1.0 - ts.anchor.x);
			vertices[5] = vertices[7] = ts._height * (1.0 - ts.anchor.y);

			if (ts.uvRespectAnchor)
			{
				vertices = quad.uvs;

				vertices[0] = vertices[6] = -ts.anchor.x;
				vertices[1] = vertices[3] = -ts.anchor.y;

				vertices[2] = vertices[4] = 1.0 - ts.anchor.x;
				vertices[5] = vertices[7] = 1.0 - ts.anchor.y;
			}

			quad.upload();

			const tex = ts._texture;
			const baseTex = tex.baseTexture;
			const lt = ts.tileTransform.localTransform;
			const uv = ts.uvTransform;
			let isSimple = baseTex.isPowerOfTwo
				&& tex.frame.width === baseTex.width && tex.frame.height === baseTex.height;

			// auto, force repeat wrapMode for big tiling textures
			if (isSimple)
			{
				if (!baseTex._glTextures[renderer.CONTEXT_UID])
				{
					if (baseTex.wrapMode === WRAP_MODES.CLAMP)
					{
						baseTex.wrapMode = WRAP_MODES.REPEAT;
					}
				}
				else
				{
					isSimple = baseTex.wrapMode !== WRAP_MODES.CLAMP;
				}
			}

			const shader = isSimple ? this.simpleShader : this.shader;

			renderer.bindShader(shader);

			const w = tex.width;
			const h = tex.height;
			const W = ts._width;
			const H = ts._height;

			tempMat.set(lt.a * w / W,
				lt.b * w / H,
				lt.c * h / W,
				lt.d * h / H,
				lt.tx / W,
				lt.ty / H);

			// that part is the same as above:
			// tempMat.identity();
			// tempMat.scale(tex.width, tex.height);
			// tempMat.prepend(lt);
			// tempMat.scale(1.0 / ts._width, 1.0 / ts._height);

			tempMat.invert();
			if (isSimple)
			{
				tempMat.prepend(uv.mapCoord);
			}
			else
			{
				shader.uniforms.uMapCoord = uv.mapCoord.toArray(true);
				shader.uniforms.uClampFrame = uv.uClampFrame;
				shader.uniforms.uClampOffset = uv.uClampOffset;
			}

			shader.uniforms.uTransform = tempMat.toArray(true);
			shader.uniforms.uColor = utils.premultiplyTintToRgba(ts.tint, ts.worldAlpha,
				shader.uniforms.uColor, baseTex.premultipliedAlpha);
			shader.uniforms.translationMatrix = ts.transform.worldTransform.toArray(true);

			shader.uniforms.uSampler = renderer.bindTexture(tex);

			renderer.setBlendMode(utils.correctBlendMode(ts.blendMode, baseTex.premultipliedAlpha));

			quad.vao.draw(this.renderer.gl.TRIANGLES, 6, 0);
		}
	}

	PIXI.WebGLRenderer.registerPlugin('tilingSprite2d', TilingSprite2dRenderer);
}
