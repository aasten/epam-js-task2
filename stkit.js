var STKit = (function(){

  var EntriesLimitedCache = function(maxEntries) {
    this.maxEntries = maxEntries;
    this.cachedEntries = []; // [ {key: value} ]
    this.cachedEntriesCount = 0;
    this.cache = function(key, value) {
      if(this.cachedEntriesCount >= maxEntries) {
        this.cachedEntries.shift();
        this.cachedEntriesCount--;
      }
//       var entry = Object.create(null);
// console.log(key);
// console.log(value);
//       Object.defineProperty(entry,key,value);
// console.log(entry);
      this.cachedEntries.push({'key': key, 'value': value});
      this.cachedEntriesCount++;
    };
    this.cachedValue = function(key,comparator) {
      var filtered = this.cachedEntries.filter(function(cachedPair){
        if(comparator) {
          return comparator(cachedPair.key,key);
        } else {
          if(cachedPair.key == key) {
            return true;
          }
        }
        });
      if(filtered.length > 0) {
        var last = filtered.pop();
        // console.log(last);
        return last.value;
      } else {
        return null;
      }
    };
  };

  return {

    /**
    @function memoized
    @param fn is function to be memoized
    @returns memoized implementation of given function
    @throws string object if given argument is not a function
    @todo check the original function for return non-undefined
    */
    memoized: function(fn) {
      if(typeof fn !== 'function') {
        throw ('argument "' + arguments[0] + '" provided is not a function');
      }
      var cache = new EntriesLimitedCache(2);

      var arraysComparator = function(array1, array2) {
        return array1.length == array2.length && array1.every(function(element, index) {
          return element === array2[index];
        });
      };

      // var args = arguments;
      return function() {
        console.log(cache);
        // keys for cache will be arrays, so arrays comparator is provided to
        // check for cache hit
        var cachedValue = cache.cachedValue(
          Array.prototype.slice.call(arguments), arraysComparator);
        if(cachedValue) {
          console.log('cache hit');
          return cachedValue;
        } else {
          var newCached = fn.apply(this,arguments);
          cache.cache(Array.prototype.slice.call(arguments), newCached);
          return newCached;
        }
      };
    },

    /**
    @function debehaviorize
    @param some object to debehaviorize
    @returns debehaviorized object
    */
    debehaviorize: function (some) {
      if(!(some instanceof Object)) {
        // console.log(some + ' is not an instance of Object, it is ' + typeof some);
        return some;
      }
      var ret = {};
      for(var propName in some) {
        if(some.hasOwnProperty(propName)) {
          // console.log('loop:' + propName + ' is ' + (typeof ret[propName]));
          if(typeof some[propName] !== 'function') {
            // console.log('trying to debehaviorize ' + propName);
            ret[propName] = this.debehaviorize(some[propName]);
          }
        }
      }
      return ret;
    },

    /**
    @function isArrayLike
    @param obj is object to check
    @returns boolean whether given object is an array-like
    */
    isArrayLike: function (obj) {
      return Object.prototype.hasOwnProperty.call(obj,'length') &&
        typeof obj.length === 'number';
    },


  };

})();

/**
IIFE is named hereinafter to show designation
*/
(function testDebehaviorize(){
  var a = { n: 1, a: 'a',
    complex: { obj: { x: function() {console.log('i am a function');} } }};
  // Object.freeze(a.complex.obj);
  // Object.seal(a.complex.obj);
  console.log('**** Test debehaviorizing *****');
  console.log(a);
  var da = STKit.debehaviorize(a);
  console.log('After debehaviorizing');
  console.log('original object:');
  console.log(a);
  console.log('debehaviorized object:');
  console.log(da);
  console.log('\n\n');
})();

// array of objects to test
[
  (function(){
    var test = Object.create(null);
    test[0] = 1;
    test[1] = 2;
    test.length = 2;
    return test;
  })(),

  (function(){
    console.log(arguments);
    return arguments;
  })(),

  [],

  42,

  (function(){
    var test = Object.create(null);
    test[0] = 1;
    test[1] = 2;
    test.length = 'some string';
    return test;
  })(),

].forEach(
(function testIsArrayLike(test){
  console.log('**** Test is array like *****');
  console.log(test);
  var testIsArrayLike = STKit.isArrayLike(test);
  console.log('Object above' + ((testIsArrayLike)?' is ':' is not ') + 'an array-like object');
  // this will show whether the test object is really array-like
  if(testIsArrayLike) {
    console.log('Taking last element from test object with Array.prototype.pop():');
    console.log(Array.prototype.pop.call(test));
    console.log('Test object now is:');
    console.log(test);
  }
  console.log('\n\n');
}));

// TODO semicolonson instead
function foo(a) {
  console.log('this is foo(' + a + ')');
  return a;
}

foo('x');
foo('x');
try {
var memfoo = STKit.memoized(foo);
memfoo(1);
memfoo(2);
memfoo(2);
memfoo(3);
memfoo(3);
} catch(e) {
  console.log(e);
}
