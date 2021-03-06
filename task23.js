/**
Students Kit module
*/
var STKit = (function(){

  /**
  Cache implementation with limited entries count.
  After limit is reached the latest entries inserted will be shifted out from
  the cache and the new ones are pushed.
  */
  var EntriesLimitedCache = function(maxEntries) {
    this.maxEntries = maxEntries;
    this.cachedEntries = []; // [ {key: value} ]
    this.cachedEntriesCount = 0;
    this.cache = function(key, value) {
      if(this.cachedEntriesCount >= maxEntries) {
        this.cachedEntries.shift();
        this.cachedEntriesCount--;
      }
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
        return last.value;
      } else {
        return null;
      }
    };
  };

  var parseSemicolonSONdebehaviorized = function (semicolonSONstr) {
    var str = semicolonSONstr;
    // trim leading spaces and empty semicolons
    str = str.replace(/^[\s;]*/,'');
    // trim trailing spaces and empty semicolons
    str = str.replace(/[\s;]*$/,'');
    str = str.replace(/,/g,':'); // , -> :
    str = str.replace(/;/g,','); // ; -> ,
    str = str.replace(/([a-zA-Z_][0-9a-zA-Z\-_]*)/g,'"$1"'); // quoting lexeme with non-digit first char
    return JSON.parse('{' + str + '}');
  };

  var semicolonSONwithRemovedFuncDeclarations = function(str) {
    return str.replace(/;([^,]+),\|(.*)\|/g,'');
  };

  /**
  Find and return bodies of non-argument functions in given string in "SemicolonSON"
  format.
  @returns array containing arguments for apply the Function constructor.
  Earch arguments entry is array itself containing function body (as found in semicolonSON)
  as last element. Arguments for the function body prepends the body, if threy are found.
  */
  var getFunctionsFromSemicolonSON = function(str) {
    var functionDeclarations = [];
    str.replace(/;([^,]+),\|(.*)\|/g,function(match,methodName,body,offset,string){
      functionDeclarations.push({'methodName': methodName,'body': body});
    });

    var ret = [];
    functionDeclarations.forEach(function(value){
      var entry = [];
      var match = value.body.match(/function[\s]*\(([^)]*)\)[\s]{(.*)}/);
      if(match) {
        // omit match[0] which is whole match. Put groups values only
        // args list
        entry.push(match[1]);
        // body
        entry.push(match[2]);
      } else {
        // "function(var){body}" not found, consider whole expression as body
        entry.push(value.body);
      }
      ret.push({'methodName': value.methodName, 'entry': entry});
    });

    return ret;
  };

  return {

    /**
    @function memoized
    @param {fn} is function to be memoized
    @param {maxEntries} is an optional parameter of cache capacity
    @returns memoized implementation of given function
    @throws string object if given argument is not a function
    @todo check the original function for return non-undefined
    */
    memoized: function(fn,maxEntries) {
      if(typeof fn !== 'function') {
        throw ('argument "' + arguments[0] + '" provided is not a function');
      }
      var cache = new EntriesLimitedCache((maxEntries)?maxEntries:10);

      var arraysComparator = function(array1, array2) {
        return array1.length == array2.length && array1.every(function(element, index) {
          return element === array2[index];
        });
      };

      return function() {
// console.log(cache);
        // keys for cache will be arrays, so arrays comparator is provided to
        // check for cache hit
        var cachedValue = cache.cachedValue(
          Array.prototype.slice.call(arguments), arraysComparator);
        if(cachedValue) {
// console.log('cache hit');
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
    @param {some} object to debehaviorize
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
    @param {obj} is object to check
    @returns boolean whether given object is an array-like
    */
    isArrayLike: function (obj) {
      return Object.prototype.hasOwnProperty.call(obj,'length') &&
        typeof obj.length === 'number';
    },

    /**
    @function parseSemicolonSONobject
    parsing js objects as followed:
    @example
    ";key,value;methodName,|return true|;" => { key: 'value',  method: function() {return true;} }
    ";key,value;methodName,|function (a) { return a + 1; }|;" => { key: 'value',  method: function(a) {return a + 1;} }
    @param {str} semicolonSON string
    @returns js object from given semicolonSON string
    */
    parseSemicolonSONobject: function(str) {
      // array [[args-endings-with-body]]
      var argFuncBodies = getFunctionsFromSemicolonSON(str);
      // parsing string from which function declarations are removed:
      var retObj = parseSemicolonSONdebehaviorized(
        semicolonSONwithRemovedFuncDeclarations(str));
      argFuncBodies.forEach(function(funcDecl,index,array){
        // funcDecl.entry is [arg1,...argN,function-body]
        retObj[funcDecl.methodName] = Function.apply(null,funcDecl.entry);
      });
      return retObj;
    },

  };

})();

// -------------- testing ------------------------------------------------------

/**
IIFE is named hereinafter to show designation
*/
(function testDebehaviorize(){
  var a = { n: 1, a: 'a',
    complex: { obj: { x: function() {console.log('i am a function');} } }};
  // freezing or sealing have no effect here
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



(function testMemoizedAndSemicolonSONparsing() {

  console.log('**** Test memoization and parsing semicolonSON *****');

  var testSemicolonSONparse = function(test){
    var parsedObj = STKit.parseSemicolonSONobject(test);
    console.log('"' + test + '" \n=> ');
    console.log(parsedObj);
  };
  var sampleSemicolonSONs = [
    ';key,value;methodName,|return true|;',
    ';key,value;methodName,|function (a) { return a + 1; }|;',
    ';key,value;methodName,|function (a) { return a + 1; }|;',
  ];

  var beginRaw = new Date();

  sampleSemicolonSONs.forEach(testSemicolonSONparse);

  var endRaw = new Date();

  console.log('--------- unmemoized parser function done in ' +
    (endRaw.getTime() - beginRaw.getTime()) + 'ms');

  try {
  var memoizedSemicolonSONparse = STKit.memoized(testSemicolonSONparse);
  var beginMemoized = new Date();
  sampleSemicolonSONs.forEach(memoizedSemicolonSONparse);
  var endMemoized = new Date();
  console.log('--------- memoized parser function done in ' +
    (endMemoized.getTime() - beginMemoized.getTime()) + 'ms');
  } catch(e) {
    console.log(e);
  }

  console.log('\n\n');

})();

// some WET code here
(function testMemoizeFib() {
  console.log('**** Test memoization for fibonacci recursive function *****');

  var testFunc = function(n) {
    if (n <= 2) {
      if(n < 1) return 0;
      return 1;
    } else {
      return testFunc(n - 2) + testFunc(n - 1);
    }
  };

  var fibFor = 42;

  var beginRaw = new Date();

  console.log('unmemoizedFibonacci(' + fibFor + ')=' + testFunc(fibFor));

  var endRaw = new Date();

  console.log('unmemoized fibonacci done in ' +
    (endRaw.getTime() - beginRaw.getTime()) + 'ms');

  try {
  testFunc = STKit.memoized(testFunc,fibFor);
  var beginMemoized = new Date();
  console.log('memoizedFibonacci(' + fibFor + ')=' + testFunc(fibFor));
  var endMemoized = new Date();
  console.log('memoized fibonacci function done in ' +
    (endMemoized.getTime() - beginMemoized.getTime()) + 'ms');
  } catch(e) {
    console.log(e);
  }

  console.log('\n\n');
}());
