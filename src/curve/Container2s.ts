import { ProjectionSurface } from './ProjectionSurface';
import { Container } from '@pixi/display';
import { Matrix } from '@pixi/math';

export class Container2s extends Container
{
    constructor()
    {
        super();
        this.proj = new ProjectionSurface(this.transform);
    }

    proj: ProjectionSurface;

    get worldTransform(): Matrix
    {
        return this.proj as any;
    }
}
