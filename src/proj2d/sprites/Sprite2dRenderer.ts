namespace pixi_projection {
    import TYPES = PIXI.TYPES;
    import premultiplyTint = PIXI.utils.premultiplyTint;

    const shaderVert =
        `precision highp float;
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
`;
    const shaderFrag = `
varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;
uniform sampler2D uSamplers[%count%];

void main(void){
vec4 color;
%forloop%
gl_FragColor = color * vColor;
}`;

    export class Batch3dGeometry extends PIXI.Geometry
    {
        _buffer: PIXI.Buffer;
        _indexBuffer : PIXI.Buffer;

        constructor(_static = false)
        {
            super();

            this._buffer = new PIXI.Buffer(null, _static, false);

            this._indexBuffer = new PIXI.Buffer(null, _static, true);

            this.addAttribute('aVertexPosition', this._buffer, 3, false, TYPES.FLOAT)
                .addAttribute('aTextureCoord', this._buffer, 2, false, TYPES.FLOAT)
                .addAttribute('aColor', this._buffer, 4, true, TYPES.UNSIGNED_BYTE)
                .addAttribute('aTextureId', this._buffer, 1, true, TYPES.FLOAT)
                .addIndex(this._indexBuffer);
        }
    }

    export class Batch2dPluginFactory {
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

                packGeometry(element: any, float32View: Float32Array, uint32View: Uint32Array,
                             indexBuffer: Uint16Array, index: number, indexCount: number)
                {
                    const p = index / this.vertexSize;// float32View.length / 6 / 2;
                    const uvs = element.uvs;
                    const indicies = element.indices;// geometry.getIndex().data;// indicies;
                    const vertexData = element.vertexData;
                    const vertexData2d = element.vertexData2d;
                    const textureId = element._texture.baseTexture._id;

                    const alpha = Math.min(element.worldAlpha, 1.0);

                    const argb = alpha < 1.0 && element._texture.baseTexture.premultiplyAlpha ? premultiplyTint(element._tintRGB, alpha)
                        : element._tintRGB + (alpha * 255 << 24);

                    if (vertexData2d) {
                        let j = 0;
                        for (let i = 0; i < vertexData2d.length; i += 3, j += 2)
                        {
                            float32View[index++] = vertexData2d[i];
                            float32View[index++] = vertexData2d[i + 1];
                            float32View[index++] = vertexData2d[i + 2];
                            float32View[index++] = uvs[j];
                            float32View[index++] = uvs[j + 1];
                            uint32View[index++] = argb;
                            float32View[index++] = textureId;
                        }
                    } else {
                        for (let i = 0; i < vertexData.length; i += 3)
                        {
                            float32View[index++] = vertexData[i];
                            float32View[index++] = vertexData[i + 1];
                            float32View[index++] = 1.0;
                            float32View[index++] = uvs[i];
                            float32View[index++] = uvs[i + 1];
                            uint32View[index++] = argb;
                            float32View[index++] = textureId;
                        }
                    }

                    for (let i = 0; i < indicies.length; i++)
                    {
                        indexBuffer[indexCount++] = p + indicies[i];
                    }
                }
            };
        }
    }

	PIXI.Renderer.registerPlugin('batch2d', Batch2dPluginFactory.create({}) as any);
}
