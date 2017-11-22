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

  it('adds args', function (done) {
    const source = {
      'modules': {
        'map': './map',
        'layers': 'layers-dependency'
      }
    };

    cb = function (e, ret) {
      let json = JSON.parse(ret);
      assert.deepEqual(json.args.map, ['opts', 'dep1']);
      assert.deepEqual(json.args.layers, ['opts', 'dep2']);
      done();
    };

    loader.call(context, JSON.stringify(source));
  });

  it('adds args to specific key', function (done) {
    context.options = { args: 'a' };
    const source = {
      'modules': {
        'map': './map',
        'layers': 'layers-dependency'
      }
    };

    cb = function (e, ret) {
      let json = JSON.parse(ret);
      assert.deepEqual(json.a.map, ['opts', 'dep1']);
      assert.deepEqual(json.a.layers, ['opts', 'dep2']);
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
      assert.deepEqual(json.args.map, ['opts', 'dep1']);
      assert.deepEqual(json.args.layers, ['opts', 'dep2']);
      done();
    };

    loader.call(context, JSON.stringify(source));
  });

  it('does not override existing args', function (done) {
    const source = {
      'modules': {
        'map': './map',
        'layers': 'layers-dependency'
      },
      'args': {
        'map': ['x'],
        'layers': ['y']
      }
    };

    cb = function (e, ret) {
      let json = JSON.parse(ret);
      assert.deepEqual(json.args.map, ['x']);
      assert.deepEqual(json.args.layers, ['y']);

      done();
    };

    loader.call(context, JSON.stringify(source));
  });

  it('skips args if specified', function (done) {
    context.options = { skip: 1 };
    const source = {
      'modules': {
        'map': './map',
        'layers': 'layers-dependency'
      }
    };

    cb = function (e, ret) {
      let json = JSON.parse(ret);
      assert.deepEqual(json.args.map, ['dep1']);
      assert.deepEqual(json.args.layers, ['dep2']);

      done();
    };

    loader.call(context, JSON.stringify(source));
  });
});
