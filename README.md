# pixi-projection

Collection of projections, both 2d and 3d. 

There are many ways to define projections even when we are using only 2 dimensions. 

Two-point projections in 2d are good for parallax.

```js
// create app or renderer, whatever works for you
var app = new PIXI.Application(800, 600, {backgroundColor : 0x1099bb});
document.body.appendChild(app.view);

// specify where the center of projection is
var center = new PIXI.Sprite(Texture.WHITE);
center.anchor.set(0.5);
center.position.set(app.screen.width/2, app.screen.height/2);

app.stage.addChild(center);

// create a sprite

var spr = new PIXI.projection.Sprite2d(Texture.WHITE);
spr.position.set(app.screen.width - 100, 100);
spr.scale.set(5);
spr.tint = 0xffff00;
app.stage.addChild(spr);

//one-point projection for Y axis

spr.projY.follow = center;
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
