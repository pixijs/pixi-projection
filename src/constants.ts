export enum AFFINE {
	NONE = 0,
	FREE = 1,
	AXIS_X = 2,
	AXIS_Y = 3,
	POINT = 4,
	AXIS_XR = 5
}

export enum TRANSFORM_STEP {
	NONE = 0,
	// POS = 1,
	// ROT = 2,
	// SCALE = 3,
	// PIVOT = 4,
	BEFORE_PROJ = 4,
	PROJ = 5,
	// POS_2 = 6,
	// ROT_2 = 7,
	// SCALE_2 = 8,
	// PIVOT_2 = 9,
	ALL = 9
}