namespace pixi_projection.utils {
    export function createIndicesForQuads(size: number) {
        // the total number of indices in our array, there are 6 points per quad.

        const totalIndices = size * 6;

        const indices = new Uint16Array(totalIndices);

        // fill the indices with the quads to draw
        for (let i = 0, j = 0; i < totalIndices; i += 6, j += 4) {
            indices[i + 0] = j + 0;
            indices[i + 1] = j + 1;
            indices[i + 2] = j + 2;
            indices[i + 3] = j + 0;
            indices[i + 4] = j + 2;
            indices[i + 5] = j + 3;
        }

        return indices;
    }

    //bit twiddle is here

    export function isPow2(v: number): boolean {
        return !(v & (v - 1)) && (!!v);
    }

    export function nextPow2(v: number): number {
        v += +(v === 0);
        --v;
        v |= v >>> 1;
        v |= v >>> 2;
        v |= v >>> 4;
        v |= v >>> 8;
        v |= v >>> 16;
        return v + 1;
    }

    export function log2(v: number) {
        let r: number, shift: number;
        r = +(v > 0xFFFF) << 4;
        v >>>= r;
        shift = +(v > 0xFF  ) << 3;
        v >>>= shift;
        r |= shift;
        shift = +(v > 0xF   ) << 2;
        v >>>= shift;
        r |= shift;
        shift = +(v > 0x3   ) << 1;
        v >>>= shift;
        r |= shift;
        return r | (v >> 1);
    }
}
