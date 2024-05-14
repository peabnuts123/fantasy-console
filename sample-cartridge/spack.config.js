const { config } = require("@swc/core/spack");
const fs = require('fs');
const path = require('path');

let basePath = path.resolve(__dirname, 'src/');
module.exports = config({
  entry: findFilesRecursive(basePath)
    .filter((file) => {
      return (file.endsWith('.ts') && !file.endsWith('.d.ts'));
    })
    .reduce((entryPoints, file) => {
      let moduleName = path.relative(basePath, file).replace(/\.[^\.]+$/, '');
      console.log(`Building module: ${moduleName} => ${file}`);
      entryPoints[moduleName] = file;
      return entryPoints;
    }, {}),
  output: {
    path: path.resolve(__dirname, "content/cartridge/scripts"),
  },
});

function findFilesRecursive(fullPath) {
  let files = [];
  fs.readdirSync(fullPath).forEach(file => {
      const absolutePath = path.join(fullPath, file);
      if (fs.statSync(absolutePath).isDirectory()) {
          const filesFromNestedFolder = findFilesRecursive(absolutePath);
          filesFromNestedFolder.forEach(file => {
              files.push(file);
          })
      } else {
        files.push(absolutePath);
      }
    });
  return files
}

