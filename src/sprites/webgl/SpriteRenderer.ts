declare module PIXI {
    export interface ObjectRenderer {
        renderer: WebGLRenderer;
    }

    export interface BaseTexture {
        _virtalBoundId: number;
    }
}

namespace pixi_projection.webgl {
    import BaseTexture = PIXI.BaseTexture;
    import ObjectRenderer = PIXI.ObjectRenderer;
    import settings = PIXI.settings;
    import GLBuffer = PIXI.glCore.GLBuffer;
    import VertexArrayObject = PIXI.glCore.VertexArrayObject;

    import WebGLRenderer = PIXI.WebGLRenderer;
    import Sprite = PIXI.Sprite;

    import premultiplyTint = PIXI.utils.premultiplyTint;
    import premultiplyBlendMode = PIXI.utils.premultiplyBlendMode;

    let TICK = 0;

    export class BatchGroup {
        textures: Array<BaseTexture> = [];
        textureCount = 0;
        ids: Array<Number> = [];
        size = 0;
        start = 0;
        blend = PIXI.BLEND_MODES.NORMAL;
    }

    export class SpriteRenderer extends ObjectRenderer {
        vertSize = 6;
        vertByteSize = this.vertSize * 4;
        size = settings.SPRITE_BATCH_SIZE;
        buffers: Array<BatchBuffer>;

        indices: Uint16Array;

        shader: PIXI.Shader;

        currentIndex = 0;
        groups: Array<BatchGroup>;
        sprites: Array<Sprite> = [];

        indexBuffer: GLBuffer;
        vertexBuffers: Array<GLBuffer> = [];
        vaos: Array<VertexArrayObject> = [];
        vao: VertexArrayObject;
        vaoMax = 2;
        vertexCount = 0;

        MAX_TEXTURES = 1;

        /**
         * @param {PIXI.WebGLRenderer} renderer - The renderer this sprite batch works for.
         */
        constructor(renderer: WebGLRenderer) {
            super(renderer);

            this.indices = utils.createIndicesForQuads(this.size);

            this.groups = [];
            for (let k = 0; k < this.size; k++) {
                this.groups[k] = new BatchGroup();
            }

            this.buffers = [];
            for (let i = 1; i <= utils.nextPow2(this.size); i *= 2) {
                this.buffers.push(new BatchBuffer(i * 4 * this.vertByteSize));
            }

            this.vaoMax = 2;
            this.vertexCount = 0;

            this.renderer.on('prerender', this.onPrerender, this);
        }

        /**
         * Sets up the renderer context and necessary buffers.
         *
         * @private
         */
        onContextChange() {
            const gl = this.renderer.gl;

            this.MAX_TEXTURES = this.renderer.plugins['sprite'].MAX_TEXTURES;

            // generate generateMultiTextureProgram, may be a better move?
            this.shader = generateMultiTextureShader(gl, this.MAX_TEXTURES);

            this.indexBuffer = GLBuffer.createIndexBuffer(gl, this.indices, gl.STATIC_DRAW);

            // we use the second shader as the first one depending on your browser may omit aTextureId
            // as it is not used by the shader so is optimized out.

            this.renderer.bindVao(null);

            const attrs = this.shader.attributes;

            for (let i = 0; i < this.vaoMax; i++) {
                /* eslint-disable max-len */
                const vertexBuffer = this.vertexBuffers[i] = GLBuffer.createVertexBuffer(gl, null, gl.STREAM_DRAW);
                /* eslint-enable max-len */

                // build the vao object that will render..
                const vao = this.renderer.createVao()
                    .addIndex(this.indexBuffer)
                    .addAttribute(vertexBuffer, attrs.aVertexPosition, gl.FLOAT, false, this.vertByteSize, 0)
                    .addAttribute(vertexBuffer, attrs.aTextureCoord, gl.UNSIGNED_SHORT, true, this.vertByteSize, 3 * 4)
                    .addAttribute(vertexBuffer, attrs.aColor, gl.UNSIGNED_BYTE, true, this.vertByteSize, 4 * 4);

                if (attrs.aTextureId) {
                    vao.addAttribute(vertexBuffer, attrs.aTextureId, gl.FLOAT, false, this.vertByteSize, 5 * 4);
                }

                this.vaos[i] = vao;
            }

            this.vao = this.vaos[0];
        }

        /**
         * Called before the renderer starts rendering.
         *
         */
        onPrerender() {
            this.vertexCount = 0;
        }

        /**
         * Renders the sprite object.
         *
         * @param {PIXI.Sprite} sprite - the sprite to render when using this spritebatch
         */
        render(sprite: Sprite) {
            // TODO set blend modes..
            // check texture..
            if (this.currentIndex >= this.size) {
                this.flush();
            }

            // get the uvs for the texture

            // if the uvs have not updated then no point rendering just yet!
            if (!(sprite as any)._texture._uvs) {
                return;
            }

            // push a texture.
            // increment the batchsize
            this.sprites[this.currentIndex++] = sprite;
        }

        /**
         * Renders the content and empties the current batch.
         *
         */
        flush() {
            if (this.currentIndex === 0) {
                return;
            }

            const gl = this.renderer.gl;
            const MAX_TEXTURES = this.MAX_TEXTURES;

            const np2 = utils.nextPow2(this.currentIndex);
            const log2 = utils.log2(np2);
            const buffer = this.buffers[log2];

            const sprites = this.sprites;
            const groups = this.groups;

            const float32View = buffer.float32View;
            const uint32View = buffer.uint32View;

            // const touch = 0;// this.renderer.textureGC.count;

            let index = 0;
            let nextTexture: any;
            let currentTexture: BaseTexture;
            let groupCount = 1;
            let textureId = 0;
            let textureCount = 0;
            let currentGroup = groups[0];
            let vertexData;
            let uvs;
            let blendMode = premultiplyBlendMode[
                (sprites[0] as any)._texture.baseTexture.premultipliedAlpha ? 1 : 0][sprites[0].blendMode];

            currentGroup.textureCount = 0;
            currentGroup.start = 0;
            currentGroup.blend = blendMode;

            TICK++;

            let i;

            for (i = 0; i < this.currentIndex; ++i) {
                // upload the sprite elemetns...
                // they have all ready been calculated so we just need to push them into the buffer.

                // upload the sprite elemetns...
                // they have all ready been calculated so we just need to push them into the buffer.
                const sprite = sprites[i] as any;

                nextTexture = sprite._texture.baseTexture;
                textureId = nextTexture._virtalBoundId;

                const spriteBlendMode = premultiplyBlendMode[Number(nextTexture.premultipliedAlpha)][sprite.blendMode];

                if (blendMode !== spriteBlendMode) {
                    // finish a group..
                    blendMode = spriteBlendMode;

                    // force the batch to break!
                    currentTexture = null;
                    textureCount = MAX_TEXTURES;
                    TICK++;
                }

                if (currentTexture !== nextTexture) {
                    currentTexture = nextTexture;

                    if (nextTexture._enabled !== TICK) {
                        if (textureCount === MAX_TEXTURES) {
                            TICK++;

                            textureCount = 0;

                            currentGroup.size = i - currentGroup.start;

                            currentGroup = groups[groupCount++];
                            currentGroup.textureCount = 0;
                            currentGroup.blend = blendMode;
                            currentGroup.start = i;
                        }

                        nextTexture._enabled = TICK;
                        nextTexture._virtalBoundId = textureCount;

                        currentGroup.textures[currentGroup.textureCount++] = nextTexture;
                        textureCount++;
                    }
                }

                vertexData = sprite.vertexData;

                // TODO this sum does not need to be set each frame..
                uvs = sprite._texture._uvs.uvsUint32;
                textureId = nextTexture._batchId;

                if (vertexData.length === 8) {
                    //PIXI standart sprite
                    if (this.renderer.roundPixels) {
                        const resolution = this.renderer.resolution;

                        float32View[index] = ((vertexData[0] * resolution) | 0) / resolution;
                        float32View[index + 1] = ((vertexData[1] * resolution) | 0) / resolution;
                        float32View[index + 2] = 1.0;

                        float32View[index + 6] = ((vertexData[2] * resolution) | 0) / resolution;
                        float32View[index + 7] = ((vertexData[3] * resolution) | 0) / resolution;
                        float32View[index + 8] = 1.0;

                        float32View[index + 12] = ((vertexData[4] * resolution) | 0) / resolution;
                        float32View[index + 13] = ((vertexData[5] * resolution) | 0) / resolution;
                        float32View[index + 14] = 1.0;

                        float32View[index + 18] = ((vertexData[6] * resolution) | 0) / resolution;
                        float32View[index + 19] = ((vertexData[7] * resolution) | 0) / resolution;
                        float32View[index + 20] = 1.0;
                    }
                    else {
                        float32View[index] = vertexData[0];
                        float32View[index + 1] = vertexData[1];
                        float32View[index + 2] = 1.0;

                        float32View[index + 6] = vertexData[2];
                        float32View[index + 7] = vertexData[3];
                        float32View[index + 8] = 1.0;

                        float32View[index + 12] = vertexData[4];
                        float32View[index + 13] = vertexData[5];
                        float32View[index + 14] = 1.0;

                        float32View[index + 18] = vertexData[6];
                        float32View[index + 19] = vertexData[7];
                        float32View[index + 20] = 1.0;
                    }
                } else {
                    // projective 2d/3d sprite

                    // I removed roundPixels, dont need that for those kind of sprites

                    float32View[index] = vertexData[0];
                    float32View[index + 1] = vertexData[1];
                    float32View[index + 2] = vertexData[2];

                    float32View[index + 6] = vertexData[3];
                    float32View[index + 7] = vertexData[4];
                    float32View[index + 8] = vertexData[5];

                    float32View[index + 12] = vertexData[6];
                    float32View[index + 13] = vertexData[7];
                    float32View[index + 14] = vertexData[8];

                    float32View[index + 18] = vertexData[9];
                    float32View[index + 19] = vertexData[10];
                    float32View[index + 20] = vertexData[11];
                }

                uint32View[index + 3] = uvs[0];
                uint32View[index + 9] = uvs[1];
                uint32View[index + 15] = uvs[2];
                uint32View[index + 21] = uvs[3];

                /* eslint-disable max-len */
                const alpha = Math.min(sprite.worldAlpha, 1.0);
                // we dont call extra function if alpha is 1.0, that's faster
                const argb = alpha < 1.0 && nextTexture.premultipliedAlpha ? premultiplyTint(sprite._tintRGB, alpha)
                    : sprite._tintRGB + (alpha * 255 << 24);

                uint32View[index + 4] = uint32View[index + 10] = uint32View[index + 16] = uint32View[index + 22] = argb;
                float32View[index + 5] = float32View[index + 11] = float32View[index + 17] = float32View[index + 23] = nextTexture._virtalBoundId;
                /* eslint-enable max-len */
                index += 24;
            }

            currentGroup.size = i - currentGroup.start;

            if (!settings.CAN_UPLOAD_SAME_BUFFER) {
                // this is still needed for IOS performance..
                // it really does not like uploading to the same buffer in a single frame!
                if (this.vaoMax <= this.vertexCount) {
                    this.vaoMax++;

                    const attrs = this.shader.attributes;

                    /* eslint-disable max-len */
                    const vertexBuffer = this.vertexBuffers[this.vertexCount] = GLBuffer.createVertexBuffer(gl, null, gl.STREAM_DRAW);
                    /* eslint-enable max-len */

                    // build the vao object that will render..
                    const vao = this.renderer.createVao()
                        .addIndex(this.indexBuffer)
                        .addAttribute(vertexBuffer, attrs.aVertexPosition, gl.FLOAT, false, this.vertByteSize, 0)
                        .addAttribute(vertexBuffer, attrs.aTextureCoord, gl.UNSIGNED_SHORT, true, this.vertByteSize, 3 * 4)
                        .addAttribute(vertexBuffer, attrs.aColor, gl.UNSIGNED_BYTE, true, this.vertByteSize, 4 * 4);

                    if (attrs.aTextureId) {
                        vao.addAttribute(vertexBuffer, attrs.aTextureId, gl.FLOAT, false, this.vertByteSize, 5 * 4);
                    }

                    this.vaos[this.vertexCount] = vao;
                }

                this.renderer.bindVao(this.vaos[this.vertexCount]);

                this.vertexBuffers[this.vertexCount].upload(buffer.vertices, 0, false);

                this.vertexCount++;
            }
            else {
                // lets use the faster option, always use buffer number 0
                this.vertexBuffers[this.vertexCount].upload(buffer.vertices, 0, true);
            }

            // / render the groups..
            for (i = 0; i < groupCount; i++) {
                const group = groups[i];
                const groupTextureCount = group.textureCount;


                for (let j = 0; j < groupTextureCount; j++) {
                    this.renderer.bindTexture(group.textures[j], j, true);
                }

                // set the blend mode..
                this.renderer.state.setBlendMode(group.blend);

                gl.drawElements(gl.TRIANGLES, group.size * 6, gl.UNSIGNED_SHORT, group.start * 6 * 2);
            }

            // reset elements for the next flush
            this.currentIndex = 0;
        }

        /**
         * Starts a new sprite batch.
         */
        start() {
            this.renderer.bindShader(this.shader);

            if (settings.CAN_UPLOAD_SAME_BUFFER) {
                // bind buffer #0, we don't need others
                this.renderer.bindVao(this.vaos[this.vertexCount]);

                this.vertexBuffers[this.vertexCount].bind();
            }
        }

        /**
         * Stops and flushes the current batch.
         *
         */
        stop() {
            this.flush();
        }

        /**
         * Destroys the SpriteRenderer.
         *
         */
        destroy() {
            for (let i = 0; i < this.vaoMax; i++) {
                if (this.vertexBuffers[i]) {
                    this.vertexBuffers[i].destroy();
                }
                if (this.vaos[i]) {
                    this.vaos[i].destroy();
                }
            }

            if (this.indexBuffer) {
                this.indexBuffer.destroy();
            }

            this.renderer.off('prerender', this.onPrerender, this);

            super.destroy();

            if (this.shader) {
                this.shader.destroy();
                this.shader = null;
            }

            this.vertexBuffers = null;
            this.vaos = null;
            this.indexBuffer = null;
            this.indices = null;

            this.sprites = null;

            for (let i = 0; i < this.buffers.length; ++i) {
                this.buffers[i].destroy();
            }
        }
    }

    WebGLRenderer.registerPlugin('sprite2d', SpriteRenderer);
}
