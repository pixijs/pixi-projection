precision highp float;
varying vec2 vertexPosition;
varying vec3 vTrans1;
varying vec3 vTrans2;
varying vec2 vSamplerSize;
varying vec4 vFrame;
varying vec4 vColor;
varying float vTextureId;

uniform sampler2D uSamplers[%count%];
uniform vec4 distortion;

void main(void){
vec2 surface;
vec2 surface2;

float vx = vertexPosition.x;
float vy = vertexPosition.y;
float dx = distortion.x;
float dy = distortion.y;
float revx = distortion.z;
float revy = distortion.w;

if (distortion.x == 0.0) {
	surface.x = vx;
	surface.y = vy / (1.0 + dy * vx);
	surface2 = surface;
} else
if (distortion.y == 0.0) {
	surface.y = vy;
	surface.x = vx / (1.0 + dx * vy);
	surface2 = surface;
} else {
	float c = vy * dx - vx * dy;
	float b = (c + 1.0) * 0.5;
	float b2 = (-c + 1.0) * 0.5;
	float d = b * b + vx * dy;
	if (d < -0.00001) {
	    discard;
	}
	d = sqrt(max(d, 0.0));
	surface.x = (- b + d) * revy;
	surface2.x = (- b - d) * revy;
	surface.y = (- b2 + d) * revx;
	surface2.y = (- b2 - d) * revx;
}

vec2 uv;
uv.x = vTrans1.x * surface.x + vTrans1.y * surface.y + vTrans1.z;
uv.y = vTrans2.x * surface.x + vTrans2.y * surface.y + vTrans2.z;

vec2 pixels = uv * vSamplerSize;

if (pixels.x < vFrame.x || pixels.x > vFrame.z ||
	pixels.y < vFrame.y || pixels.y > vFrame.w) {
	uv.x = vTrans1.x * surface2.x + vTrans1.y * surface2.y + vTrans1.z;
	uv.y = vTrans2.x * surface2.x + vTrans2.y * surface2.y + vTrans2.z;
	pixels = uv * vSamplerSize;

   if (pixels.x < vFrame.x || pixels.x > vFrame.z ||
       pixels.y < vFrame.y || pixels.y > vFrame.w) {
       discard;
   }
}

vec4 edge;
edge.xy = clamp(pixels - vFrame.xy + 0.5, vec2(0.0, 0.0), vec2(1.0, 1.0));
edge.zw = clamp(vFrame.zw - pixels + 0.5, vec2(0.0, 0.0), vec2(1.0, 1.0));

float alpha = 1.0; //edge.x * edge.y * edge.z * edge.w;
vec4 rColor = vColor * alpha;

float textureId = floor(vTextureId+0.5);
vec2 vTextureCoord = uv;
vec4 color;
%forloop%
gl_FragColor = color * rColor;
}