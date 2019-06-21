namespace pixi_projection {
    export class Mesh extends PIXI.Mesh {
        static defaultVertexShader =
            `precision highp float;
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform mat3 uTransform;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position.xyw = projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0);
    gl_Position.z = 0.0;

    vTextureCoord = (uTransform * vec3(aTextureCoord, 1.0)).xy;
}
`;
        static defaultFragmentShader = `
varying vec2 vTextureCoord;
uniform vec4 uColor;

uniform sampler2D uSampler;

void main(void)
{
    gl_FragColor = texture2D(uSampler, vTextureCoord) * uColor;
}`;
        constructor(geometry: PIXI.Geometry, shader: PIXI.Shader, state: PIXI.State, drawMode?: number)
        {
            super(geometry, shader, state, drawMode);
            this.proj = new Projection2d(this.transform);
        }

        vertexData2d = new Float32Array(1);
        proj: Projection2d;

        calculateVertices()
        {
            if (this.proj._affine) {
                this.vertexData2d = null;
                super.calculateVertices();
                return;
            }

            const geometry = this.geometry as any;
            const vertices = geometry.buffers[0].data;
            const thisAny = this as any;

            if (geometry.vertexDirtyId === thisAny.vertexDirty && thisAny._transformID === thisAny.transform._worldID)
            {
                return;
            }

            thisAny._transformID = thisAny.transform._worldID;

            if (thisAny.vertexData.length !== vertices.length)
            {
                thisAny.vertexData = new Float32Array(vertices.length);
            }

            if (this.vertexData2d.length  !== vertices.length * 3 / 2)
            {
                this.vertexData2d = new Float32Array(vertices.length * 3);
            }

            const wt = this.proj.world.mat3;

            const vertexData2d = this.vertexData2d;
            const vertexData = thisAny.vertexData;

            for (let i = 0; i < vertexData.length / 2; i++)
            {
                const x = vertices[(i * 2)];
                const y = vertices[(i * 2) + 1];

                const xx = (wt[0] * x) + (wt[3] * y) + wt[6];
                const yy = (wt[1] * x) + (wt[4] * y) + wt[7];
                const ww = (wt[2] * x) + (wt[5] * y) + wt[8];

                vertexData2d[i * 3] = xx;
                vertexData2d[i * 3 + 1] = yy;
                vertexData2d[i * 3 + 2] = ww;

                vertexData[(i * 2)] = xx / ww;
                vertexData[(i * 2) + 1] = yy / ww;
            }

            thisAny.vertexDirty = geometry.vertexDirtyId;
        }

        toLocal<T extends PIXI.IPoint>(position: PIXI.IPoint, from?: PIXI.DisplayObject,
                                       point?: T, skipUpdate?: boolean,
                                       step = TRANSFORM_STEP.ALL): T {
            return container2dToLocal.call(this, position, from, point, skipUpdate, step);
        }

        get worldTransform() {
            return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
        }
    }

	export class SimpleMesh2d extends Mesh {
		constructor(texture: PIXI.Texture, vertices?: Float32Array, uvs?: Float32Array,
		            indices?: Uint16Array, drawMode?: number) {
            super(new PIXI.MeshGeometry(vertices, uvs, indices),
                new PIXI.MeshMaterial(texture, {
                    program: PIXI.Program.from(Mesh.defaultVertexShader, Mesh.defaultFragmentShader)
                }),
                null,
                drawMode);

            (this.geometry.getBuffer('aVertexPosition') as any).static = false;
		}

		autoUpdate = true;

        get vertices()
        {
            return this.geometry.getBuffer('aVertexPosition').data;
        }
        set vertices(value)
        {
            this.geometry.getBuffer('aVertexPosition').data = value;
        }

        _render(renderer?: PIXI.Renderer)
        {
            if (this.autoUpdate)
            {
                this.geometry.getBuffer('aVertexPosition').update();
            }

            super._render(renderer);
        }
	}
}
