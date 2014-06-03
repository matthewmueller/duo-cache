
## duo-cache

  Duo's cache.

### API

#### Cache(path)

  Initialize `Cache` with `path`.

#### add(repo, stream)

  Add `repo`, `stream`.

    add('org:project@0.0.1', stream);
    add('org:project@0.0.2', stream);

#### lookup(repo)

  Lookup `repo@x.x.x`, returns `path` or `null`.

    add('org:project@0.0.1');
    lookup('org:project@0.0.x');
    // => /path/to/org:project@0.0.1.tar.gz

    lookup('org:project@1.x');
    // => null

#### destroy()

  Remove all repos.

#### repos()

  Get all cached repos.


### License
  
  (MIT)
