namespace pixi_projection {
    import TYPES = PIXI.TYPES;
    import premultiplyTint = PIXI.utils.premultiplyTint;

    //TODO: Work in progress

    const shaderVert = `precision highp float;
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
`;

    const shaderFrag = `precision highp float;
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
    //if (d < -0.00001) {
    //    discard;
    //}
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
    
//    if (pixels.x < vFrame.x || pixels.x > vFrame.z ||
//        pixels.y < vFrame.y || pixels.y > vFrame.w) {
//        discard;
//    }
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
gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
//gl_FragColor = color * rColor;
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
                .addAttribute('aSamplerSize', this._buffer, 2, false, TYPES.FLOAT)
                .addAttribute('aFrame', this._buffer, 4, false, TYPES.FLOAT)
                .addAttribute('aColor', this._buffer, 4, true, TYPES.UNSIGNED_BYTE)
                .addAttribute('aTextureId', this._buffer, 1, true, TYPES.FLOAT)
                .addIndex(this._indexBuffer);
        }
    }

    export class BatchBilinearPluginFactory {
        static create(options: any): any
        {
            const { vertex, fragment, vertexSize, geometryClass } = (Object as any).assign({
                vertex: shaderVert,
                fragment: shaderFrag,
                geometryClass: BatchBilineardGeometry,
                vertexSize: 16,
            }, options);

            return class BatchPlugin extends UniformBatchRenderer
            {
                constructor(renderer: PIXI.Renderer)
                {
                    super(renderer);

                    this.shaderGenerator = new PIXI.BatchShaderGenerator(vertex, fragment);
                    this.geometryClass = geometryClass;
                    this.vertexSize = vertexSize;
                }

                defUniforms = {
                    translationMatrix: new PIXI.Matrix(),
                    distortion: new Float32Array([0, 0])
                };
                size = 1000;
                forceMaxTextures = 1;

                getUniforms(sprite: PIXI.Sprite) {
                    let  { proj } = sprite as Sprite2s;
                    if (proj.surface !== null) {
                        return proj.uniforms;
                    }
                    if (proj._activeProjection !== null) {
                        return proj._activeProjection.uniforms;
                    }
                    return this.defUniforms;
                }

                packInterleavedGeometry(element: any, attributeBuffer: PIXI.ViewableBuffer, indexBuffer: Uint16Array, aIndex: number, iIndex: number)
                {
                    const {
                        uint32View,
                        float32View,
                    } = attributeBuffer;
                    const p = aIndex / this.vertexSize;
                    const indices = element.indices;
                    const vertexData = element.vertexData;
                    const tex = element._texture;
                    const frame = tex._frame;
                    const aTrans = element.aTrans;
                    const { _batchLocation, realWidth, realHeight, resolution } = element._texture.baseTexture;

                    const alpha = Math.min(element.worldAlpha, 1.0);

                    const argb = alpha < 1.0 && element._texture.baseTexture.alphaMode ? premultiplyTint(element._tintRGB, alpha)
                        : element._tintRGB + (alpha * 255 << 24);

                    for (let i = 0; i < vertexData.length; i += 2)
                    {
                        float32View[aIndex] = vertexData[i * 2];
                        float32View[aIndex + 1] = vertexData[i * 2 + 1];

                        float32View[aIndex + 2] = aTrans.a;
                        float32View[aIndex + 3] = aTrans.c;
                        float32View[aIndex + 4] = aTrans.tx;
                        float32View[aIndex + 5] = aTrans.b;
                        float32View[aIndex + 6] = aTrans.d;
                        float32View[aIndex + 7] = aTrans.ty;

                        float32View[aIndex + 8] = realWidth;
                        float32View[aIndex + 9] = realHeight;
                        float32View[aIndex + 10] = frame.x * resolution;
                        float32View[aIndex + 11] = frame.y * resolution;
                        float32View[aIndex + 12] = (frame.x + frame.width) * resolution;
                        float32View[aIndex + 13] = (frame.y + frame.height) * resolution;

                        uint32View[aIndex + 14] = argb;
                        float32View[aIndex + 15] = _batchLocation;
                        aIndex += 16;
                    }

                    for (let i = 0; i < indices.length; i++)
                    {
                        indexBuffer[iIndex++] = p + indices[i];
                    }
                }
            };
        }
    }

    PIXI.Renderer.registerPlugin('batch_bilinear', BatchBilinearPluginFactory.create({}));
}
