
var semver = require('semver');
var revs = ['1.0.0', 'master', '0.0.1'];

console.log('before', revs);
revs = revs.sort(sort);
console.log('one', revs);
revs = revs.sort(sort);
console.log('two', revs);
revs = revs.sort(sort);
console.log('three', revs);

function sort(a, b){
  try {
    return semver.rcompare(a, b);
  } catch (e) {
    return semver.valid(a, b) ? -1 : 1;
  }
}
