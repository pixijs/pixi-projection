#!/usr/bin/env node
var fs = require('fs');
var glob = require('glob');
var path = require('path');

var sourcePath = path.resolve(__dirname, '../src');
var files = glob.sync(sourcePath + '/**/*.ts');

var filesCompilation = '';

for (var i in files) {
    var filePath = files[i];
    var fileContents = fs.readFileSync(filePath);

    filesCompilation += fileContents;
}

var sourcePath2 = path.resolve(__dirname, '../spine');
var files2 = glob.sync(sourcePath2 + '/**/*.ts');

for (var i in files2) {
    var filePath = files2[i];
    var fileContents = fs.readFileSync(filePath);

    filesCompilation += fileContents;
}

var tmp = require('tmp');
var process = require('child_process');

tmp.file({postfix: '.ts'}, function (err, filename) {
    fs.writeFileSync(filename, filesCompilation);
    process.exec('tsc --module none --target es5 --declaration --removeComments node_modules/pixi.js/pixi.js.d.ts node_modules/pixi-spine/dist/pixi-spine.d.ts ' + filename, function(err, stdout, stderr) {
        var dtsPath = filename.replace('.ts', '.d.ts');
        var dtsContent = '' + fs.readFileSync(dtsPath);

        fs.writeFileSync(
            path.resolve('dist/pixi-projection-spine.d.ts'),
            dtsContent.replace(/namespace pixi_projection/g, 'module PIXI.projection')
                .replace(/pixi_projection/g, 'PIXI.projection')
        );
    });
});
