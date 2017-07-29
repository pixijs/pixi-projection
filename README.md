# pixi-projection

Collection of projections, both 2d and 3d. 

There are many ways to define projections even when we are using only 2 dimensions. 

Two-point projections in 2d are good for parallax.

Done:

- Projective 2d transform
- Projective 2d quad mapping (buggy)

Work in progress:

- Bilinear transform
- Projective 2d by euler angles
- Option to "drop" projection and go back to PIXI.Matrix in a child


## Examples

[Two-point projection](http://pixijs.github.io/examples/#/projection/basic.js)

[Free quad projective transform](http://pixijs.github.io/examples/#/projection/quad.js)


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
