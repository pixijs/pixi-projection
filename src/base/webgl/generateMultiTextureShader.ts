namespace pixi_projection.webgl {
	export function generateMultiTextureShader(vertexSrc: string, fragmentSrc: string, gl: WebGLRenderingContext, maxTextures: number) {
		fragmentSrc = fragmentSrc.replace(/%count%/gi, maxTextures + '');
		fragmentSrc = fragmentSrc.replace(/%forloop%/gi, generateSampleSrc(maxTextures));

		const shader = new PIXI.Shader(gl, vertexSrc, fragmentSrc);

		const sampleValues = new Int32Array(maxTextures);

		for (let i = 0; i < maxTextures; i++) {
			sampleValues[i] = i;
		}

		shader.bind();
		shader.uniforms.uSamplers = sampleValues;

		return shader;
	}

	function generateSampleSrc(maxTextures: number) {
		let src = '';

		src += '\n';
		src += '\n';

		for (let i = 0; i < maxTextures; i++) {
			if (i > 0) {
				src += '\nelse ';
			}

			if (i < maxTextures - 1) {
				src += `if(textureId == ${i}.0)`;
			}

			src += '\n{';
			src += `\n\tcolor = texture2D(uSamplers[${i}], vTextureCoord);`;
			src += '\n}';
		}

		src += '\n';
		src += '\n';

		return src;
	}
}
