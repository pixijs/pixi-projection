# pixi-projection

[![Build Status](https://travis-ci.org/pixijs/pixi-projection.svg?branch=master)](https://travis-ci.org/pixijs/pixi-projection)

Collection of projections, both 2d and 3d.

To-do:

- Docs
- Graphics support

## Compatibility

It works with PixiJS v5. 

For v4 please see [v4.x branch](https://github.com/pixijs/pixi-projection/tree/v4.x), npm version `0.2.8`

It even works with CanvasRenderer, though result can be strange.

## Examples

3d Projection (Yummy!)

[Cards](http://pixijs.github.io/examples/#/projection/cards.js)

[Runner](http://pixijs.github.io/examples/#/projection/runner.js)

Projective sprites: Container2d, Sprite2d, Text2d

[Two-point projection](http://pixijs.github.io/examples/#/projection/basic.js)

[One-point with return to affine](http://pixijs.github.io/examples/#/projection/plane.js)

[Projective transform of quad](http://pixijs.github.io/examples/#/projection/quad-homo.js)

## Bilinear projection

There are many ways to define projections even when we use only 2 dimensions.

**WORK IN PROGRESS, BEING PORTED TO v5**

Surface sprites: Container2s, Sprite2s, Text2s for now only bilinear

[Bilinear transform of quad](http://pixijs.github.io/examples/#/projection/quad-bi.js)

## Usage

### Special classes

For every projective way, there are corresponding classes:

* Container2d, Sprite2d, Text2d, TilingSprite2d, Mesh2d, Spine2d
* Sprite3d, Text3d, Mesh3d2d, Spine3d, Camera3d
* Container2s, Sprite2s **WORK IN PROGRESS*

We dont support Graphics yet :(

Also you can convert corresponding pixi objects

```
var sprite = new PIXI.Sprite();
sprite.convertTo3d();
sprite.position3d.set(0, 0, 1); //available now!

var container = new PIXI.Container();
container.convertTo3d();
sprite.position3d.set(0, 0, 1); //available now!
```

You can also convert whole subtree:

```js
var tree = new PIXI.Container();
var child = new PIXI.Container();
tree.addChild(child);
tree.convertSubtreeTo2d(tree);
child.position3d.set(0, 0, 1); //available now!
```

### 3D transforms

The most useful thing is 3D transforms.

It all, starts from a camera, dont use 3d elements outside of it - it doesnt make sence.

You can create several cameras if you want each element to has his own perspective parameters.

```js
var camera = new PIXI.projection.Camera3d();
camera.setPlanes(400, 10, 10000, false); // true if you want orthographics projection
// I assume you have an app or renderer already 
camera.position.set(app.screen.width / 2, app.screen.height / 2);
```

In this case, 400 is focus distance. If width of the screen is 800, that means 90 degrees horizontal FOV.
Everything that's behind `z < -390` will be cut by near plane, everything that's too far away `z > 9600` will be cut too. 

We position camera at the center of the screen, so element with `position3d=(0,0,0)` will appear right in center.
However, camera can look at something else - a character, or just the point with same coords as center of the screen.

```js
camera.position3d.set(app.screen.width/2, app.screen.height/2);
```

With this snippet, every element in the camera that does not use extra 3d fields (`z`, `euler`) will appear exactly like in pixi stage.
That's how awesome our Camera implementation is!

Camera transform differs from other elements: 

```js
//camera follows player
camera.position3d.copy(player.position3d);
// player is two times smaller now
player.scale3d.set(0.5); 
// but camera follows it too, now everything except player is two times bigger on screen :)
camera.scale3d.set(0.5); 
```

Containers and Sprites have extra fields for positioning inside 3d space.

PixiJS gives only `position`, `scale`, `rotation`, `pivot`, 
and projection plugin adds `position3d`, `euler`, `scale3d`, `pivot3d`. Those fields applied in transforms after vanilla pixi fields.

The only exception is a `Camera3d`, that applies `projection` just after pixi fields, and then applies 3d fields in **reversed** order.
That's why it can follow elements - its transform negates the element transform.

### Spine

There's special build `pixi-projection-spine` to support Spine objects, please browse `dist` folder.

### Heaven

No, we dont support `pixi-heaven` sprites yet.

### What if element is not supported by library?

For complex objects that are not supported by library, there is a way to add them inside the camera **If their plane is perpendicular to the camera**.

Create `Container3d` that returns all children to 2d space: `container3d.affine = PIXI.projection.AFFINE.AXIS_X;` 
Any 2d elements added to that container will think of it as a simple 2d container, and custom renderers will work with it just fine.

This way is also **more performant** because **Sprite works faster than Sprite3d. 4x4 matrices ARE VERY SLOW**.

### Sorting

`pixi-projection` provides extra fields to handle sorting. 
 
* `getDepth` returns the distance from near plane to the object local (0,0,0), you can pass it to zIndex or zOrder as `element.zIndex = -element.getDepth()`
* `isFrontFace` detects the face of the object plane

Those fields can be used with custom sorting solution or with [pixi-layers](https://github.com/pixijs/pixi-display/tree/layers/)

### Culling

Will be available after we add it to `pixi-layers`

## Building

You will need to have [node][node] setup on your machine.

Make sure you have [yarn][yarn] installed:

    npm install -g yarn

Then you can install dependencies and build:

```bash
yarn
yarn build
```

That will output the built distributables to `./bin`.

[node]:             https://nodejs.org/
[typescript]:       https://www.typescriptlang.org/
[yarn]:             https://yarnpkg.com
