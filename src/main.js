import fs from 'fs';
import UglifyJS from 'uglify-js';
import loaderUtils from 'loader-utils';

const DEFAULT_OPTS = {
  modules: 'modules',
  args: 'args',
  'function': 'bricjs',
  skip: 0
};

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

  getArgs(modules, skip) {
    let loader = this.loader;
    let walker = this.walker;
    let parser = this;
    this.skip = skip;

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
    if (found) this.args = node.argnames.map(a => a.name).splice(this.skip);
    return found;
  }
}

export default function (source) {
  const opts = Object.assign({}, DEFAULT_OPTS, loaderUtils.getOptions(this));

  let json = JSON.parse(source);
  let modules = json[opts.modules];
  let args = json[opts.args];

  let parser = new Parser(this, opts.function);
  let promises = parser.getArgs(modules, opts.skip);
  let cb = this.async();
  Promise.all(promises).then(function (values) {
    json[opts.args] = Object.assign(...values, args);
    cb(null, JSON.stringify(json));
  }).catch(err => cb(err));
}
