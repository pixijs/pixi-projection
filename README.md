# pixi-projection

[![Build Status](https://travis-ci.org/pixijs/pixi-projection.svg?branch=master)](https://travis-ci.org/pixijs/pixi-projection)

Collection of projections, both 2d and 3d. 

There are many ways to define projections even when we are using only 2 dimensions. 

Two-point projections in 2d are good for parallax.

Done:

- Projective 2d transform
- Projective 2d quad mapping
- Bilinear 2d quad mapping

Backlog:

- Projective 2d by euler angles
- Option to "drop" projection and go back to PIXI.Matrix in a child

To-do:

- Docs

## Examples

Projective sprites: Container2d, Sprite2d, Text2d

[Two-point projection](http://pixijs.github.io/examples/#/projection/basic.js)
[Projective transform of quad](http://pixijs.github.io/examples/#/projection/quad-homo.js)

Surface sprites: Container2s, Sprite2s, Text2s for now only bilinear

[Bilinear transform of quad](http://pixijs.github.io/examples/#/projection/quad-bi.js)

## Usage

### convert existing elements

Same can be applied to Container2s. You cant use both projective and surface sprites

```js
var sprite = new PIXI.Sprite();
sprite.convertTo2d();
sprite.proj; //available now!

var container = new PIXI.Container();
container.convertTo2d();
sprite.proj; //available now!

var tree = new PIXI.Container();
var child = new PIXI.Container();
tree.addChild(child);
tree.convertSubtreeTo2d(tree);
child.proj; //available now!
```

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
