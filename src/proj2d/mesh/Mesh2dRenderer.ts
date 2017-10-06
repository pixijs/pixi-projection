namespace pixi_projection {
	let shaderVert =
		`precision highp float;
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform mat3 uTransform;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position.xyw = projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0);
    gl_Position.z = 0.0;

    vTextureCoord = (uTransform * vec3(aTextureCoord, 1.0)).xy;
}
`;
	let shaderFrag = `
varying vec2 vTextureCoord;
uniform vec4 uColor;

uniform sampler2D uSampler;

void main(void)
{
    gl_FragColor = texture2D(uSampler, vTextureCoord) * uColor;
}`;

	export class Mesh2dRenderer extends PIXI.mesh.MeshRenderer {
		onContextChange()
		{
			const gl = this.renderer.gl;

			this.shader = new PIXI.Shader(gl, shaderVert, shaderFrag);
		}
	}

	PIXI.WebGLRenderer.registerPlugin('mesh2d', Mesh2dRenderer);
}
