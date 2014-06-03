
/**
 * Module dependencies.
 */

var debug = require('debug')('duo-cache');
var write = require('fs').createWriteStream;
var thunk = require('thunkify');
var semver = require('semver');
var assert = require('assert');
var resolve = require('path').resolve;
var join = require('path').join;
var fs = require('co-fs');

/**
 * Expose `Cache`
 */

module.exports = Cache;

/**
 * Initialize `Cache`
 * 
 * TODO: add .hits(): Int .misses(): Int
 * TODO: add limit('1gb') etc..
 * 
 * @param {String} path
 * @api public
 */

function Cache(path){
  if (!(this instanceof Cache)) return new Cache(path);
  assert(path, 'path required');
  this.basepath = resolve(path);
}

/**
 * Add `repo`, `path`.
 * 
 * TODO: allow branches.
 * 
 * @param {String} repo
 * @param {Stream} stream
 * @return {Function}
 * @api public
 */

Cache.prototype.add = function*(repo, stream){
  if (yield this.lookup(repo)) return this;
  debug('adding %s', repo);
  var dest = this.join(repo) + '.tar.gz';
  var parts = repo.split('@');
  var name = parts.shift();
  var rev = parts.shift();
  assert(semver.valid(rev), '"' + rev + '" is not a valid semver version.');
  var repos = yield this.repos();
  yield pipe(stream, write(dest));
  (repos[name] = repos[name] || []).push(rev);
  yield this.persist();
  debug('added %s to cache', repo);
  return this;
};

/**
 * Remove `repo`.
 * 
 * @param {String} repo
 * @return {Cache}
 * @api public
 */

Cache.prototype.remove = function*(repo){
  yield rmrf(this.join(repo));
  var repos = yield this.repos()[name];
  delete repos[repo];
  yield this.persist();
  debug('removed %s', repo);
  return this;
};

/**
 * Destroy cache.
 * 
 * @return {Cache}
 * @api public
 */

Cache.prototype.destroy = function*(){
  yield rmrf(this.basepath);
  return this;
};

/**
 * Resolve `repo@version`.
 * 
 * Example:
 * 
 *      add('org:repo@0.0.1');
 *      add('org:repo@0.0.2');
 *      resolve('org:repo@*');
 *      // => 0.0.2
 * 
 * @param {String} repo
 * @return {Cache}
 * @api public
 */

Cache.prototype.resolve = function*(repo){
  var repos = yield this.repos();
  var parts = repo.split('@');
  var name = parts.shift();
  var rev = parts.shift();
  var revs = repos[name] || [];
  var ret;

  revs.sort(semver.rcompare);

  for (var i = 0; i < revs.length; ++i) {
    if (semver.satisfies(revs[i], rev)) {
      ret = revs[i];
      break;
    }
  }

  return ret;
};

/**
 * Get path of `repo`
 * 
 * @param {String} repo
 * @return {String}
 * @api private
 */

Cache.prototype.join = function(repo){
  return join(this.basepath, repo);
};

/**
 * Get all cached repos.
 * 
 * Example:
 * 
 *      add('org:project@0.0.1')
 *      add('org:project@0.1.0');
 *      add('org:project@master');
 *      repos();
 * 
 *      {
 *        'org:project': [
 *          '0.0.1',
 *          '0.1.0',
 *          'master'
 *        ]
 *      }
 * 
 * @return {Object}
 * @api private
 */

Cache.prototype.repos = function*(){
  var path = this.join('.repos');
  return this._repos = this._repos || (yield json(path));
};

/**
 * Lookup `repo@rev` path.
 * 
 * @param {String} repo
 * @return {String}
 * @api public
 */

Cache.prototype.lookup = function*(repo){
  var rev = yield this.resolve(repo);
  var name = repo.split('@')[0];
  debug('lookup %s', repo);
  if (!rev) return rev;
  var path = this.join(name + '@' + rev);
  debug('%s -> %s', repo, path);
  return path + '.tar.gz';
};

/**
 * Persist all repos.
 * 
 * @return {Cache}
 * @api public
 */

Cache.prototype.persist = function*(){
  var str = JSON.stringify(yield this.repos());
  var path = this.join('.duo');
  yield fs.writeFile(path, str);
  return this;
};

/**
 * Read `path` as json.
 * 
 * @param {String} path
 * @return {Object}
 * @api private
 */

function *json(path){
  try {
    return JSON.parse(yield fs.readFile(path, 'utf-8'));
  } catch (e) {
    return {};
  }
};

/**
 * Pipe `a`, `b`.
 * 
 * TODO: o_O
 * 
 * @param {Stream} a
 * @param {Stream} b
 * @return {Function}
 * @api private
 */

function pipe(a, b){
  return function(done){
    a.on('error', done);
    b.on('error', done);
    a.on('end', done);
    a.pipe(b);
  };
}
