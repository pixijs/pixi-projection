precision highp float;
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