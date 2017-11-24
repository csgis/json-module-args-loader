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

    this._createPromise = this._createPromise.bind(this);
    this.visit = this.visit.bind(this);

    this.walker = new UglifyJS.TreeWalker(this.visit);
  }

  _createPromise(name) {
    return new Promise((resolve, reject) => {
      this.loader.resolve(this.loader.context, this.modules[name], (err, path) => {
        if (err) {
          reject(err);
        } else if (!fs.existsSync(path)) {
          reject(new Error(`Module '${name}' resolves to '${path}', which does not exist.`));
        } else {
          let contents = fs.readFileSync(path, 'UTF-8');
          let parsed = UglifyJS.minify(contents, UGLIFY_OPTS);
          if (parsed.ast && parsed.ast.walk) {
            parsed.ast.walk(this.walker);
            resolve({
              [name]: this.args
            });
          } else {
            reject(new SyntaxError(`Cannot parse '${path}'. Caused by: "${parsed.error.message}" `));
          }
        }
      });
    });
  }

  getArgs(modules, skip) {
    this.skip = skip;
    this.modules = modules;
    return Object.keys(modules).map(this._createPromise);
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
