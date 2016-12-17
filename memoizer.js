
function EntriesLimitedCache(maxEntries) {
  this.maxEntries = maxEntries;
  this.cachedEntries = []; // [ {key: value} ]
  this.cachedEntriesCount = 0;
  this.cache = function(key, value) {
    if(cachedEntriesCount >= maxEntries) {
      cachedEntries.shift();
    }
    cachedEntries.push({key:value});
    cachedEntriesCount++;
  };
  this.cachedValue = function(key) {
    var filtered = this.cachedEntries.filter(function(cachedPair){
        if(cachedPair.key == key) {
          return true;
        }
      });
    if(filtered.length > 0) {
      var last = filtered.pop();
      console.log('last:' + last);
      return last.value;
    } else {
      return null;
    }
  };
}


function memoized(fn) {
  this.cache = new EntriesLimitedCache(10);
  // var args = arguments;
  return function() {
    var cachedValue = cache.cachedValue(arguments);
    if(cachedValue) {
      console.log('cache hit for ' + arguments);
      return cachedValue;
    } else {
      return fn(arguments);
    }
  };
}

function foo(a) {
  console.log('this is foo(' + a + ')');
}

foo('x');
foo('x');

var memfoo = memoized(foo);

memfoo('y');
memfoo('y');
