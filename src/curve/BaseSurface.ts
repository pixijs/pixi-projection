import { IPointData, Matrix, Point } from '@pixi/math';
import { IWorldTransform } from './ProjectionSurface';
import { Dict } from '@pixi/utils';

const p = [new Point(), new Point(), new Point(), new Point()];
const a = [0, 0, 0, 0];

export abstract class Surface implements IWorldTransform
{
    surfaceID = 'default';

    _updateID = 0;

    vertexSrc = '';
    fragmentSrc = '';

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fillUniforms(uniforms: Dict<any>): void
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    {

    }

    clear(): void
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    {

    }

    /**
     * made for bilinear, other things will need adjustments, like test if (0) is inside
     * @param {ArrayLike<number>} v
     * @param out
     * @param {Matrix} after
     */
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    boundsQuad(v: ArrayLike<number>, out: any, after?: Matrix): void
    {
        let minX = out[0]; let
            minY = out[1];
        let maxX = out[0]; let
            maxY = out[1];

        for (let i = 2; i < 8; i += 2)
        {
            if (minX > out[i]) minX = out[i];
            if (maxX < out[i]) maxX = out[i];
            if (minY > out[i + 1]) minY = out[i + 1];
            if (maxY < out[i + 1]) maxY = out[i + 1];
        }

        p[0].set(minX, minY);
        this.apply(p[0], p[0]);
        p[1].set(maxX, minY);
        this.apply(p[1], p[1]);
        p[2].set(maxX, maxY);
        this.apply(p[2], p[2]);
        p[3].set(minX, maxY);
        this.apply(p[3], p[3]);

        if (after)
        {
            after.apply(p[0], p[0]);
            after.apply(p[1], p[1]);
            after.apply(p[2], p[2]);
            after.apply(p[3], p[3]);
            out[0] = p[0].x;
            out[1] = p[0].y;
            out[2] = p[1].x;
            out[3] = p[1].y;
            out[4] = p[2].x;
            out[5] = p[2].y;
            out[6] = p[3].x;
            out[7] = p[3].y;
        }
        else
        {
            for (let i = 1; i <= 3; i++)
            {
                if (p[i].y < p[0].y || (p[i].y === p[0].y && p[i].x < p[0].x))
                {
                    const t = p[0];

                    p[0] = p[i];
                    p[i] = t;
                }
            }

            for (let i = 1; i <= 3; i++)
            {
                a[i] = Math.atan2(p[i].y - p[0].y, p[i].x - p[0].x);
            }
            for (let i = 1; i <= 3; i++)
            {
                for (let j = i + 1; j <= 3; j++)
                {
                    if (a[i] > a[j])
                    {
                        const t = p[i];

                        p[i] = p[j];
                        p[j] = t;
                        const t2 = a[i];

                        a[i] = a[j];
                        a[j] = t2;
                    }
                }
            }

            out[0] = p[0].x;
            out[1] = p[0].y;
            out[2] = p[1].x;
            out[3] = p[1].y;
            out[4] = p[2].x;
            out[5] = p[2].y;
            out[6] = p[3].x;
            out[7] = p[3].y;

            if (((p[3].x - p[2].x) * (p[1].y - p[2].y)) - ((p[1].x - p[2].x) * (p[3].y - p[2].y)) < 0)
            {
                // triangle!!!
                out[4] = p[3].x;
                out[5] = p[3].y;

                return;
            }
        }
    }

    abstract apply(pos: IPointData, newPos: IPointData): IPointData;

    // TODO: remove props
    abstract applyInverse(pos: IPointData, newPos: IPointData): IPointData;
}
