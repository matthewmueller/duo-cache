
var Cache = require('..');
var thunk = require('thunkify');
var rmrf = require('rimraf');
var assert = require('assert');
var mkdir = require('fs').mkdirSync;
var Stream = require('stream').Stream;
var cofs = require('co-fs');
var fs = require('fs');

describe('duo-cache', function(){
  var cache;

  beforeEach(function(){
    rmrf.sync(__dirname + '/tmp');
    mkdir(__dirname + '/tmp');
    cache = Cache(__dirname + '/tmp');
  });

  after(function(){
    rmrf.sync(__dirname + '/tmp');
  })

  describe('()', function(){
    it('should throw', function(done){
      try {
        Cache();
      } catch (e) {
        done();
      }
    })
  })

  describe('(path)', function(){
    it('should work with optional `new`', function(){
      assert(Cache('path').constructor == new Cache('path').constructor);
    })
  })

  describe('.add(repo, stream)', function(){
    it('should throw when trying to add invalid tag', function*(){
      var msg;

      try {
        yield cache.add('org:project@master', stream());      
      } catch (e) {
        msg = e.message;
      }

      assert('"org:project@master" invalid semver' == msg);
    })

    it('should add a repo', function*(){
      yield cache.add('org:project@0.0.1', stream());
    })

    it('should persist .repos()', function*(){
      yield cache.add('org:project@0.0.1', stream());
      yield cache.add('org:project@0.0.2', stream());
      yield cache.add('org:project-b@1.0.0', stream());
      var a = yield cache.repos();
      var b = yield repos();
      assert.deepEqual(a, b);
      assert.deepEqual(a, { 'org:project': ['0.0.1', '0.0.2'], 'org:project-b': ['1.0.0'] });
    })
  })

  describe('.resolve(repo)', function(){
    describe('org:project@1.x', function(){
      it('should sort semver and return the latest', function*(){
        yield cache.add('org:project@1.0.0', stream());
        yield cache.add('org:project@1.1.0', stream());
        yield cache.add('org:project@1.2.0', stream());
        yield cache.add('org:project@1.3.0', stream());
        var rev = yield cache.resolve('org:project@1.x');
        assert('1.3.0' == rev);
      })
    })

    describe('org:project@*', function(){
      it('should return the latest tag', function*(){
        yield cache.add('org:project@1.0.0', stream());
        yield cache.add('org:project@1.1.0', stream());
        yield cache.add('org:project@1.2.0', stream());
        yield cache.add('org:project@1.3.0', stream());
        var rev = yield cache.resolve('org:project@*');
        assert('1.3.0' == rev);
      })
    })
  })

  describe('.lookup(repo)', function(){
    describe('org:project@0.0.1', function(){
      it('should return the repo path', function*(){
        yield cache.add('org:project@0.0.1', stream());
        var path = yield cache.lookup('org:project@0.0.1');
        assert(fs.existsSync(path));
      })
    })

    describe('org:project@0.0.x', function(){
      it('should return the repo path', function*(){
        yield cache.add('org:project@0.0.1', stream());
        var path = yield cache.lookup('org:project@0.0.x');
        assert(fs.existsSync(path));
      })
    })

    describe('org:project@*', function(){
      it('should return the repo path', function*(){
        yield cache.add('org:project@0.0.1', stream());
        var path = yield cache.lookup('org:project@*');
        assert(fs.existsSync(path));
      })
    })

    describe('org:project@1.x', function(){
      it('should return null when a repo is not found.', function*(){
        var path = yield cache.lookup('org:project@1.x');
        assert(null == path);
      })
    })

    describe('org:project@master', function(){
      it('should return null on invalid range', function*(){
        yield cache.add('org:project@0.0.1', stream());
        assert(null == (yield cache.lookup('org:project@master')));
      })
    })
  })
})

function stream(){
  return fs.createReadStream(__dirname + '/pkg');
}

function *repos(){
  return JSON.parse(yield cofs.readFile(__dirname + '/tmp/.repos', 'utf8'));
}
