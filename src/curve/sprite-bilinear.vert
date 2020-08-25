precision highp float;
attribute vec2 aVertexPosition;
attribute vec3 aTrans1;
attribute vec3 aTrans2;
attribute vec2 aSamplerSize;
attribute vec4 aFrame;
attribute vec4 aColor;
attribute float aTextureId;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;

varying vec2 vertexPosition;
varying vec3 vTrans1;
varying vec3 vTrans2;
varying vec2 vSamplerSize;
varying vec4 vFrame;
varying vec4 vColor;
varying float vTextureId;

void main(void){
	gl_Position.xyw = projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0);
	gl_Position.z = 0.0;

	vertexPosition = aVertexPosition;
	vTrans1 = aTrans1;
	vTrans2 = aTrans2;
	vTextureId = aTextureId;
	vColor = aColor;
	vSamplerSize = aSamplerSize;
	vFrame = aFrame;
}