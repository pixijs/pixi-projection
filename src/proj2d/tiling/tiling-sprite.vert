attribute vec2 aVertexPosition;
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