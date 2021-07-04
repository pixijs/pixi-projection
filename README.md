# pixi-projection

[![Build](https://github.com/pixijs/pixi-projection/workflows/Build/badge.svg)](https://github.com/pixijs/pixi-projection/actions?query=workflow%3A%22Build%22) [![npm version](https://badge.fury.io/js/%40pixi%2Fpixi-projection.svg)](https://badge.fury.io/js/%40pixi%2Fpixi-projection)

Collection of projections, both 2d and 3d.

To-do:

- Docs
- Graphics support

## Compatibility

Works with PixiJS v6. Compatibility with v5 is not guaranteed.

For v4 please see [v4.x branch](https://github.com/pixijs/pixi-projection/tree/v4.x), npm version `0.2.8`
For v5.1 please use npm version `0.3.5`
For >= v5.2 please see [v5.x branch](https://github.com/pixijs/pixi-projection/tree/v5.x), npm version `0.3.15`

It even works with CanvasRenderer, though result can be strange.

## Examples

3d Projection (Yummy!)

[Cards](http://pixijs.github.io/examples/#/plugin-projection/cards.js)

[Runner](http://pixijs.github.io/examples/#/plugin-projection/runner.js)

Projective sprites: Container2d, Sprite2d, Text2d

[Two-point projection](http://pixijs.github.io/examples/#/plugin-projection/basic.js)

[One-point with return to affine](http://pixijs.github.io/examples/#/plugin-projection/plane.js)

[Projective transform of quad](http://pixijs.github.io/examples/#/plugin-projection/quad-homo.js)

## Bilinear projection

There are many ways to define projections even when we use only 2 dimensions.

Surface sprites: Container2s, Sprite2s, Text2s for now only bilinear.

[Bilinear transform of quad](http://pixijs.github.io/examples/#/plugin-projection/quad-bi.js)

## Usage

### Special classes

For every projective way, there are corresponding classes:

* Container2d, Sprite2d, Text2d, TilingSprite2d, Mesh2d, Spine2d
* Sprite3d, Text3d, Mesh3d2d, Spine3d, Camera3d
* Container2s, Sprite2s **WORK IN PROGRESS*

We dont support Graphics yet :(


### Conversion of regular pixi objects

Bear in mind that if you dont use at least one class from `pixi-projection`, it might be tree-shaken away.

Here's how to use regular pixi projects to `3d` projection:

```js
import {Sprite, Container} from 'pixi.js';
var sprite = new Sprite();
sprite.convertTo3d();
sprite.position3d.set(0, 0, 1); //available now!

var container = new Container();
container.convertTo3d();
sprite.position3d.set(0, 0, 1); //available now!
```

You can also convert whole subtree:

```js
import {Container} from 'pixi.js';
var tree = new Container();
var child = new Container();
tree.addChild(child);
tree.convertSubtreeTo2d(tree);
child.position3d.set(0, 0, 1); //available now!
```

(`2d` projection in this example)

### 3D transforms

The most useful thing is 3D transforms.

It all, starts from a camera, dont use 3d elements outside of it - it doesnt make sence.

You can create several cameras if you want each element to has his own perspective parameters.

```js
import {Camera3d} from 'pixi-projection';
var camera = new Camera3d();
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

You can apply mixin from `@pixi-spine/projection` to force spine objects to spawn 2d or 3d instances of sprites and meshes.

```js
import {applySpine3dMixin} from 'pixi-projection';
import {SpineBase} from '@pixi-spine/base';

applySpine3dMixin(SpineBase.prototype);
// now all spine instances can be put in 3d projective space
```

If you apply only mixin for `2d`, dont expect fields like `position3d` to be accessible.

If your spine instance always exists in screen spcae, you can use it as it is, like in [Runner example](http://pixijs.github.io/examples/#/plugin-projection/runner.js)

Typing are injected in `SpineBase` class of `@pixi-spine/base` package. This package is usually tree-shaken away, hope its not a problem to see it in your `node_modules` even if you dont use spine.

For UMD version, you should use

```js
PIXI.projection.applySpine3dMixin(PIXI.spine.Spine.prototype);
```

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

Will be available after we add it to `@pixi/layers`

## Vanilla JS, UMD build

All pixiJS v6 plugins has special `umd` build suited for vanilla.
Navigate `pixi-projection` npm package, take `dist/pixi-projection.umd.js` file.

```html
<script src='lib/pixi.js'></script>
<script src='lib/pixi-projection.umd.js'></script>
```

all classes can be accessed through `PIXI.projection` package.

## Building

You will need to have [node][node] setup on your machine.

Then you can install dependencies and build:

```bash
npm i
npm run build
```

That will output the built distributables to `./dist`.

[node]:             https://nodejs.org/
[typescript]:       https://www.typescriptlang.org/
