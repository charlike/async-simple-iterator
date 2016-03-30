/*!
 * async-simple-iterator <https://github.com/tunnckoCore/async-simple-iterator>
 *
 * Copyright (c) 2016 Charlike Mike Reagent <@tunnckoCore> (http://www.tunnckocore.tk)
 * Released under the MIT license.
 */

'use strict'

var utils = require('./utils')
var AppBase = require('compose-emitter').ComposeEmitter

/**
 * > Initialize `AsyncSimpleIterator` with `options`.
 *
 * **Example**
 *
 * ```js
 * var ctrl = require('async')
 * var AsyncSimpleIterator = require('async-simple-iterator').AsyncSimpleIterator
 *
 * var fs = require('fs')
 * var base = new AsyncSimpleIterator({
 *   settle: true,
 *   beforeEach: function (val) {
 *     console.log('before each:', val)
 *   },
 *   error: function (err, res, val) {
 *     console.log('on error:', val)
 *   }
 * })
 * var iterator = base.wrapIterator(fs.stat, {
 *   afterEach: function (err, res, val) {
 *     console.log('after each:', val)
 *   }
 * })
 *
 * ctrl.map([
 *   'path/to/existing/file.js',
 *   'filepath/not/exist',
 *   'path/to/file'
 * ], iterator, function (err, results) {
 *   // => `err` will always be null, if `settle:true`
 *   // => `results` is now an array of stats for each file
 * })
 * ```
 *
 * @param {Object=} `options` Pass `beforeEach`, `afterEach` and `error` hooks or `settle:true`.
 * @api public
 */

function AsyncSimpleIterator (options) {
  if (!(this instanceof AsyncSimpleIterator)) {
    return new AsyncSimpleIterator(options)
  }
  this.defaultOptions(options)
  AppBase.call(this, this.options)
  this.on = this.compose('on')
  this.off = this.compose('off')
  this.once = this.compose('once')
  this.emit = this.compose('emit')
}

AppBase.extend(AsyncSimpleIterator)

/**
 * > Setting default options. Default `settle` option is `false`.
 *
 * @param  {Object=} `options` Pass `beforeEach`, `afterEach` and `error` hooks or `settle:true`.
 * @return {Object} `AsyncSimpleIterator` instance for chaining.
 * @api private
 */

AppBase.define(AsyncSimpleIterator.prototype, 'defaultOptions', function defaultOptions (options) {
  options = utils.extend({
    emitter: new utils.Emitter(),
    settle: false
  }, this.options, options)
  options.settle = typeof options.settle === 'boolean' ? !!options.settle : false
  this.options = options
  return this
})

/**
 * > Wraps `iterator` function which then can be passed to [async][] lib.
 * You can pass returned iterator function to **every** [async][] method that you want.
 *
 * **Example**
 *
 * ```js
 * var ctrl = require('async')
 * var base = require('async-simple-iterator')
 *
 * base
 *   .on('afterEach', function (err, res, value, key, next) {
 *     console.log('after each:', err, res, value, key)
 *   })
 *   .on('error', function (err, res, value, key, next) {
 *     console.log('on error:', err, res, value, key)
 *   })
 *
 * var iterator = base.wrapIterator(function (value, key, next) {
 *   console.log('actual:', value, key)
 *
 *   if (key === 'dev') {
 *      var err = new Error('err:' + key)
 *      err.value = value
 *      next(err)
 *      return
 *    }
 *    next(null, 123 + key + 456)
 *
 * }, {
 *   settle: true,
 *   beforeEach: function (value, key, next) {
 *     console.log('before each:', value, key)
 *   }
 * })
 *
 * ctrl.forEachOf({
 *   dev: './dev.json',
 *   test: './test.json',
 *   prod: './prod.json'
 * }, iterator, function done (err) {
 *   // if settle:false, `err`
 *   // if settle:true, `null`
 *   console.log('end:', err)
 * })
 * ```
 *
 * @emit  `beforeEach` with signature `val[, value], next`
 * @emit  `afterEach` with signature `err, res, val[, value], next`
 * @emit  `error` with signature `err, res, val[, value], next`
 *
 * @name   .wrapIterator
 * @param  {Function} `iterator` Iterator to pass to [async][] lib.
 * @param  {Object=} `options` Pass `beforeEach`, `afterEach` and `error` hooks or `settle` option.
 * @return {Function} Wrapped `iterator` function which can be passed to every [async][] method.
 * @api public
 */

AppBase.define(AsyncSimpleIterator.prototype, 'wrapIterator', function wrapIterator (iterator, options) {
  if (typeof iterator !== 'function') {
    throw new TypeError('async-simple-iterator: expect `iterator` to be function')
  }
  var opts = this.options
  var ctx = options ? utils.extend({}, opts.context, options.context) : opts.context
  this.options = options ? utils.extend({}, opts, options) : opts
  this.options.context = ctx

  var hooks = ['beforeEach', 'afterEach', 'error']
  var len = hooks.length
  var i = 0

  while (i < len) {
    var name = hooks[i++]
    if (typeof this.options[name] === 'function') {
      this.on(name, this.options[name])
    }
  }

  return utils.iteratorFactory(this, iterator)
})

/**
 * Expose `AsyncSimpleIterator` instance
 *
 * @type {Object}
 * @api private
 */

module.exports = new AsyncSimpleIterator()

/**
 * Expose `AsyncSimpleIterator` constructor
 *
 * @type {Function}
 * @api private
 */

module.exports.AsyncSimpleIterator = AsyncSimpleIterator
