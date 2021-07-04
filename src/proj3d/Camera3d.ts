import { Container3d } from './Container3d';

export class Camera3d extends Container3d
{
    constructor()
    {
        super();
        this.proj.cameraMode = true;
        this.setPlanes(400, 10, 10000, false);
    }

    _far = 0;
    _near = 0;
    _focus = 0;
    _orthographic = false;

    get far(): number
    {
        return this._far;
    }

    get near(): number
    {
        return this._near;
    }

    get focus(): number
    {
        return this._focus;
    }

    get ortographic(): boolean
    {
        return this._orthographic;
    }

    setPlanes(focus: number, near = 10, far = 10000, orthographic = false): void
    {
        this._focus = focus;
        this._near = near;
        this._far = far;
        this._orthographic = orthographic;

        const proj = this.proj;
        const mat4 = proj.cameraMatrix.mat4;

        proj._projID++;

        mat4[10] = 1.0 / (far - near);
        mat4[14] = (focus - near) / (far - near);
        if (this._orthographic)
        {
            mat4[11] = 0;
        }
        else
        {
            mat4[11] = 1.0 / focus;
        }
    }
}
