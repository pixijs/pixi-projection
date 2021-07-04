/* eslint-disable no-mixed-operators */
import { IPointData, Point } from '@pixi/math';

// eslint-disable-next-line max-len
export function getIntersectionFactor(p1: IPointData, p2: IPointData, p3: IPointData, p4: IPointData, out: IPointData): number
{
    const A1 = p2.x - p1.x; const B1 = p3.x - p4.x;
    const C1 = p3.x - p1.x;
    const A2 = p2.y - p1.y; const B2 = p3.y - p4.y;
    const C2 = p3.y - p1.y;
    const D = A1 * B2 - A2 * B1;

    if (Math.abs(D) < 1e-7)
    {
        out.x = A1;
        out.y = A2;

        return 0;
    }
    const T = C1 * B2 - C2 * B1;
    const U = A1 * C2 - A2 * C1;

    const t = T / D; const
        u = U / D;

    if (u < (1e-6) || u - 1 > -1e-6)
    {
        return -1;
    }

    out.x = p1.x + t * (p2.x - p1.x);
    out.y = p1.y + t * (p2.y - p1.y);

    return 1;
}

export function getPositionFromQuad(p: Array<IPointData>, anchor: IPointData, out: IPointData): IPointData
{
    out = out || new Point();
    const a1 = 1.0 - anchor.x; const
        a2 = 1.0 - a1;
    const b1 = 1.0 - anchor.y; const
        b2 = 1.0 - b1;

    out.x = (p[0].x * a1 + p[1].x * a2) * b1 + (p[3].x * a1 + p[2].x * a2) * b2;
    out.y = (p[0].y * a1 + p[1].y * a2) * b1 + (p[3].y * a1 + p[2].y * a2) * b2;

    return out;
}
