varying vec3 vTextureCoord;

uniform sampler2D uSampler;
uniform vec4 uColor;

void main(void)
{
    vec4 sample = texture2D(uSampler, vTextureCoord.xy / vTextureCoord.z);
    gl_FragColor = sample * uColor;
}