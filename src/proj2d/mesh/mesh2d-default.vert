precision highp float;

attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform mat3 uTextureMatrix;

varying vec2 vTextureCoord;

void main(void)
{
	gl_Position.xyw = projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0);
	gl_Position.z = 0.0;

	vTextureCoord = (uTextureMatrix * vec3(aTextureCoord, 1.0)).xy;
}