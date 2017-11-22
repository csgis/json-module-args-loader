debugger; // eslint-disable-line no-debugger

import loader from '../src/main.js';
import assert from 'assert';
import sinon from 'sinon';
import fs from 'fs';

describe('module', function () {
  let cb;
  let context;
  let read;
  let contents;

  beforeEach(function () {
    context = {
      async: () => cb,
      resolve: (ctx, module, callback) => callback(null, module)
    };
    contents = {};
    contents['./map'] = 'module.exports = function bricjs(opts, dep1){}';
    contents['layers-dependency'] = 'module.exports = function bricjs(opts, dep2){}';
    read = sinon.stub(fs, 'readFileSync').callsFake(key => contents[key]);
  });

  afterEach(function () {
    read.restore();
  });

  it('adds dependencies', function (done) {
    const source = {
      'modules': {
        'map': './map',
        'layers': 'layers-dependency'
      }
    };

    cb = function (e, ret) {
      let json = JSON.parse(ret);
      assert.equal(json.deps.map, 'dep1');
      assert.equal(json.deps.layers, 'dep2');
      done();
    };

    loader.call(context, JSON.stringify(source));
  });

  it('adds dependencies to specific key', function (done) {
    context.options = { deps: 'd' };
    const source = {
      'modules': {
        'map': './map',
        'layers': 'layers-dependency'
      }
    };

    cb = function (e, ret) {
      let json = JSON.parse(ret);
      assert.equal(json.d.map, 'dep1');
      assert.equal(json.d.layers, 'dep2');
      done();
    };

    loader.call(context, JSON.stringify(source));
  });

  it('uses modules from specific key', function (done) {
    context.options = { modules: 'm' };
    const source = {
      'm': {
        'map': './map',
        'layers': 'layers-dependency'
      }
    };

    cb = function (e, ret) {
      let json = JSON.parse(ret);
      assert.equal(json.deps.map, 'dep1');
      assert.equal(json.deps.layers, 'dep2');
      done();
    };

    loader.call(context, JSON.stringify(source));
  });

  it('does not override existing deps', function (done) {
    const source = {
      'modules': {
        'map': './map',
        'layers': 'layers-dependency'
      },
      'deps': {
        'map': ['x'],
        'layers': ['y']
      }
    };

    cb = function (e, ret) {
      let json = JSON.parse(ret);
      assert.equal(json.deps.map, 'x');
      assert.equal(json.deps.layers, 'y');
      done();
    };

    loader.call(context, JSON.stringify(source));
  });
});
