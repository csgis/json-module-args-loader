debugger; // eslint-disable-line no-debugger

import loader from '../src/main.js';
import assert from 'assert';
import sinon from 'sinon';
import fs from 'fs';

describe('module', function () {
  // fs mocks
  let read;
  let exists;

  let cb;
  let context;
  let contents;

  const DEFAULT_SOURCE = {
    'modules': {
      'map': './map',
      'layers': 'layers-dependency'
    }
  };

  beforeEach(function () {
    context = {
      async: () => cb,
      resolve: (ctx, module, callback) => callback(null, module)
    };
    contents = {};
    contents['./map'] = 'module.exports = function bricjs(opts, dep1){}';
    contents['layers-dependency'] = 'module.exports = function bricjs(opts, dep2){}';
    read = sinon.stub(fs, 'readFileSync').callsFake(key => contents[key]);
    exists = sinon.stub(fs, 'existsSync').callsFake(() => true);
  });

  afterEach(function () {
    read.restore();
    exists.restore();
  });

  it('adds args', function (done) {
    cb = function (e, ret) {
      assert(!e);
      let json = JSON.parse(ret);
      assert.deepEqual(json.args.map, ['opts', 'dep1']);
      assert.deepEqual(json.args.layers, ['opts', 'dep2']);
      done();
    };

    loader.call(context, JSON.stringify(DEFAULT_SOURCE));
  });

  it('adds args to specific key', function (done) {
    context.query = { args: 'a' };

    cb = function (e, ret) {
      assert(!e);
      let json = JSON.parse(ret);
      assert.deepEqual(json.a.map, ['opts', 'dep1']);
      assert.deepEqual(json.a.layers, ['opts', 'dep2']);
      done();
    };

    loader.call(context, JSON.stringify(DEFAULT_SOURCE));
  });

  it('uses modules from specific key', function (done) {
    context.query = { modules: 'm' };
    const source = {
      'm': {
        'map': './map',
        'layers': 'layers-dependency'
      }
    };

    cb = function (e, ret) {
      assert(!e);
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
      assert(!e);
      let json = JSON.parse(ret);
      assert.deepEqual(json.args.map, ['x']);
      assert.deepEqual(json.args.layers, ['y']);

      done();
    };

    loader.call(context, JSON.stringify(source));
  });

  it('skips args if specified', function (done) {
    context.query = { skip: 1 };
    cb = function (e, ret) {
      assert(!e);
      let json = JSON.parse(ret);
      assert.deepEqual(json.args.map, ['dep1']);
      assert.deepEqual(json.args.layers, ['dep2']);

      done();
    };

    loader.call(context, JSON.stringify(DEFAULT_SOURCE));
  });

  it('fails if error resolving', function (done) {
    context.resolve = (ctx, module, callback) => callback(new Error('fail'), module);

    cb = e => {
      assert(e);
      done();
    };

    loader.call(context, JSON.stringify(DEFAULT_SOURCE));
  });

  it('fails if resolved path does not exist', function (done) {
    exists.restore();
    exists = sinon.stub(fs, 'existsSync').callsFake(() => false);

    cb = e => {
      assert(e);
      done();
    };

    loader.call(context, JSON.stringify(DEFAULT_SOURCE));
  });

  it('fails if errror parsing', function (done) {
    read.restore();
    read = sinon.stub(fs, 'readFileSync').callsFake(() => 'cannot parse this');

    cb = e => {
      assert(e);
      done();
    };

    loader.call(context, JSON.stringify(DEFAULT_SOURCE));
  });
});
