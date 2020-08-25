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