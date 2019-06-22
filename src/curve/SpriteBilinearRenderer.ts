namespace pixi_projection {
    import TYPES = PIXI.TYPES;
    import premultiplyTint = PIXI.utils.premultiplyTint;

    //TODO: Work in progress

    const shaderVert = `precision highp float;
attribute vec2 aVertexPosition;
attribute vec3 aTrans1;
attribute vec3 aTrans2;
attribute vec4 aFrame;
attribute vec4 aColor;
attribute float aTextureId;

uniform mat3 projectionMatrix;
uniform mat3 worldTransform;

varying vec2 vTextureCoord;
varying vec3 vTrans1;
varying vec3 vTrans2;
varying vec4 vFrame;
varying vec4 vColor;
varying float vTextureId;

void main(void){
    gl_Position.xyw = projectionMatrix * worldTransform * vec3(aVertexPosition, 1.0);
    gl_Position.z = 0.0;
    
    vTextureCoord = aVertexPosition;
    vTrans1 = aTrans1;
    vTrans2 = aTrans2;
    vTextureId = aTextureId;
    vColor = aColor;
    vFrame = aFrame;
}
`;

    const shaderFrag = `precision highp float;
varying vec2 vTextureCoord;
varying vec3 vTrans1;
varying vec3 vTrans2;
varying vec4 vFrame;
varying vec4 vColor;
varying float vTextureId;

uniform sampler2D uSamplers[%count%];
uniform vec2 samplerSize[%count%]; 
uniform vec4 distortion;

void main(void){
vec2 surface;
vec2 surface2;

float vx = vTextureCoord.x;
float vy = vTextureCoord.y;
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
    surface.x = vx/ (1.0 + dx * vy);
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

vec2 pixels = uv * samplerSize[0];

if (pixels.x < vFrame.x || pixels.x > vFrame.z ||
    pixels.y < vFrame.y || pixels.y > vFrame.w) {
    uv.x = vTrans1.x * surface2.x + vTrans1.y * surface2.y + vTrans1.z;
    uv.y = vTrans2.x * surface2.x + vTrans2.y * surface2.y + vTrans2.z;
    pixels = uv * samplerSize[0];
    
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
%forloop%
gl_FragColor = color * rColor;
}`;

    export class BatchBilineardGeometry extends PIXI.Geometry
    {
        _buffer: PIXI.Buffer;
        _indexBuffer : PIXI.Buffer;

        constructor(_static = false)
        {
            super();

            this._buffer = new PIXI.Buffer(null, _static, false);

            this._indexBuffer = new PIXI.Buffer(null, _static, true);

            this.addAttribute('aVertexPosition', this._buffer, 2, false, TYPES.FLOAT)
                .addAttribute('aTrans1', this._buffer, 3, false, TYPES.FLOAT)
                .addAttribute('aTrans2', this._buffer, 3, false, TYPES.FLOAT)
                .addAttribute('aFrame', this._buffer, 4, false, TYPES.FLOAT)
                .addAttribute('aColor', this._buffer, 4, true, TYPES.UNSIGNED_BYTE)
                .addIndex(this._indexBuffer);
        }
    }

    export class BatchBilinearPluginFactory {
        static create(options: any)
        {
            const { vertex, fragment, vertexSize, geometryClass } = (Object as any).assign({
                vertex: shaderVert,
                fragment: shaderFrag,
                geometryClass: Batch3dGeometry,
                vertexSize: 7,
            }, options);

            return class BatchPlugin extends PIXI.BatchRenderer
            {
                constructor(renderer: PIXI.Renderer)
                {
                    super(renderer);

                    this.shaderGenerator = new PIXI.BatchShaderGenerator(vertex, fragment);
                    this.geometryClass = geometryClass;
                    this.vertexSize = vertexSize;
                }

                vertexSize: number;

                defUniforms = {
                    worldTransform: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),
                    distortion: new Float32Array([0, 0])
                };

                getUniforms(sprite: PIXI.Sprite) {
                    let proj = (sprite as Sprite2s).proj;
                    let shader = this.shader;

                    if (proj.surface !== null) {
                        return proj.uniforms;
                    }
                    if (proj._activeProjection !== null) {
                        return proj._activeProjection.uniforms;
                    }
                    return this.defUniforms;
                }

                packGeometry(element: any, float32View: Float32Array, uint32View: Uint32Array,
                             indexBuffer: Uint16Array, index: number, indexCount: number)
                {
                    const p = index / this.vertexSize;// float32View.length / 6 / 2;
                    const uvs = element.uvs;
                    const indices = element.indices;// geometry.getIndex().data;// indicies;
                    const vertexData = element.vertexData;
                    const tex = element._texture;
                    const frame = tex._frame;
                    const aTrans = element.aTrans;
                    // const textureId = element._texture.baseTexture._id;

                    const alpha = Math.min(element.worldAlpha, 1.0);

                    const argb = alpha < 1.0 && element._texture.baseTexture.premultiplyAlpha ? premultiplyTint(element._tintRGB, alpha)
                        : element._tintRGB + (alpha * 255 << 24);

                    for (let i = 0; i < vertexData.length; i += 2)
                    {
                        float32View[index] = vertexData[i * 2];
                        float32View[index + 1] = vertexData[i * 2 + 1];

                        float32View[index + 2] = aTrans.a;
                        float32View[index + 3] = aTrans.c;
                        float32View[index + 4] = aTrans.tx;
                        float32View[index + 5] = aTrans.b;
                        float32View[index + 6] = aTrans.d;
                        float32View[index + 7] = aTrans.ty;

                        float32View[index + 8] = frame.x;
                        float32View[index + 9] = frame.y;
                        float32View[index + 10] = frame.x + frame.width;
                        float32View[index + 11] = frame.y + frame.height;

                        uint32View[index + 12] = argb;
                        // float32View[index + 13] = textureId;
                        index += 13;
                    }

                    for (let i = 0; i < indices.length; i++)
                    {
                        indexBuffer[indexCount++] = p + indices[i];
                    }
                }
            };
        }
    }

    // PIXI.Renderer.registerPlugin('batch_bilinear', BatchBilinearPluginFactory.create({}) as any);
}
