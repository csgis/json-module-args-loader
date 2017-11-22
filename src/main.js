let fs = require('fs');
let UglifyJS = require('uglify-js');

const UGLIFY_OPTS = {
  parse: {},
  compress: false,
  mangle: false,
  output: {
    ast: true,
    code: false
  }
};

class Parser {
  constructor(loader, functionName) {
    this.loader = loader;
    this.exportName = functionName;
    this.walker = new UglifyJS.TreeWalker(this.visit.bind(this));
  }

  getDeps(modules) {
    let loader = this.loader;
    let walker = this.walker;
    let parser = this;

    let promises = [];
    Object.keys(modules).forEach(function (name) {
      let promise = new Promise(function (resolve, reject) {
        loader.resolve(loader.context, modules[name], function (err, result) {
          if (err) reject(err);

          let contents = fs.readFileSync(result, 'UTF-8');
          UglifyJS.minify(contents, UGLIFY_OPTS).ast.walk(walker);
          resolve({
            [name]: parser.args
          });
        });
      });
      promises.push(promise);
    });

    return promises;
  }

  visit(node) {
    let found = node instanceof UglifyJS.AST_Lambda &&
      node.name &&
      node.name.name === this.exportName;
    if (found) this.args = node.argnames.map(a => a.name).splice(1);
    return found;
  }
}

export default function (source) {
  let opts = this.options || {};
  let modulesKey = opts.modules || 'modules';
  let depsKey = opts.deps || 'deps';
  let functionName = opts.function || 'bricjs';

  let json = JSON.parse(source);
  let modules = json[modulesKey];
  let deps = json[depsKey];

  let parser = new Parser(this, functionName);
  let promises = parser.getDeps(modules);
  let cb = this.async();
  Promise.all(promises).then(function (values) {
    json[depsKey] = Object.assign(...values, deps);
    cb(null, JSON.stringify(json));
  }).catch(err => cb(err));
}
