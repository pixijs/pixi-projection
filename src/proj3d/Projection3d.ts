import { LinearProjection } from '../base';
import { ObservablePoint3d } from './Point3d';
import { Matrix, Transform } from '@pixi/math';
import { Matrix3d } from './Matrix3d';
import { ObservableEuler } from './ObservableEuler';

const tempMat = new Matrix3d();

export class Projection3d extends LinearProjection<Matrix3d>
{
    constructor(legacy: Transform, enable?: boolean)
    {
        super(legacy, enable);
        this.local = new Matrix3d();
        this.world = new Matrix3d();

        this.local.cacheInverse = true;
        this.world.cacheInverse = true;

        this.position._z = 0;
        this.scale._z = 1;
        this.pivot._z = 0;
    }

    cameraMatrix: Matrix3d = null;

    _cameraMode = false;

    get cameraMode(): boolean
    {
        return this._cameraMode;
    }

    set cameraMode(value: boolean)
    {
        if (this._cameraMode === value)
        {
            return;
        }
        this._cameraMode = value;

        this.euler._sign = this._cameraMode ? -1 : 1;
        this.euler._quatDirtyId++;

        if (value)
        {
            this.cameraMatrix = new Matrix3d();
        }
    }

    position = new ObservablePoint3d(this.onChange, this, 0, 0);
    scale = new ObservablePoint3d(this.onChange, this, 1, 1);
    euler = new ObservableEuler(this.onChange, this, 0, 0, 0);
    pivot = new ObservablePoint3d(this.onChange, this, 0, 0);

    onChange(): void
    {
        this._projID++;
    }

    clear(): void
    {
        if (this.cameraMatrix)
        {
            this.cameraMatrix.identity();
        }
        this.position.set(0, 0, 0);
        this.scale.set(1, 1, 1);
        this.euler.set(0, 0, 0);
        this.pivot.set(0, 0, 0);
        super.clear();
    }

    updateLocalTransform(lt: Matrix): void
    {
        if (this._projID === 0)
        {
            this.local.copyFrom(lt);

            return;
        }
        const matrix = this.local;
        const euler = this.euler;
        const pos = this.position;
        const scale = this.scale;
        const pivot = this.pivot;

        euler.update();

        if (!this.cameraMode)
        {
            matrix.setToRotationTranslationScale(euler.quaternion, pos._x, pos._y, pos._z, scale._x, scale._y, scale._z);
            matrix.translate(-pivot._x, -pivot._y, -pivot._z);
            matrix.setToMultLegacy(lt, matrix);

            return;
        }

        matrix.setToMultLegacy(lt, this.cameraMatrix);
        matrix.translate(pivot._x, pivot._y, pivot._z);
        matrix.scale(1.0 / scale._x, 1.0 / scale._y, 1.0 / scale._z);
        tempMat.setToRotationTranslationScale(euler.quaternion, 0, 0, 0, 1, 1, 1);
        matrix.setToMult(matrix, tempMat);
        matrix.translate(-pos._x, -pos._y, -pos._z);

        this.local._dirtyId++;
    }
}
