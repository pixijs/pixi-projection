import { main } from '@pixi-build-tools/rollup-configurator/main';
import minimist from 'minimist';

const { integration } = minimist(process.argv.splice(2), {
    default: {
        integration: 'none'
    }
});

let result;

switch(integration) {
    case 'pixi-spine':
        result = main({
            input: './integration-spine/index.ts',
            main: './lib/integration-spine/pixi-projection.js',
            module: './lib/integration-spine/pixi-projection.es.js',
            bundle: './dist/integration-spine/pixi-projection.umd.js'
        });
        break;
    default:
        console.warn(`The integration ${integration} does not exist, defaulting to none!`);
    case 'none':
        result = main();
        break;
}

export default result;