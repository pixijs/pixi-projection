varying vec3 vMaskCoord;
varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform sampler2D mask;
uniform float alpha;
uniform vec4 maskClamp;

void main(void)
{
    vec2 uv = vMaskCoord.xy / vMaskCoord.z;

    float clip = step(3.5,
        step(maskClamp.x, uv.x) +
        step(maskClamp.y, uv.y) +
        step(uv.x, maskClamp.z) +
        step(uv.y, maskClamp.w));

    vec4 original = texture2D(uSampler, vTextureCoord);
    vec4 masky = texture2D(mask, uv);

    original *= (masky.r * masky.a * alpha * clip);

    gl_FragColor = original;
}