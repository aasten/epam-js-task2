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
        entry.push(value);
      }
      ret.push({'methodName': value.methodName, 'entry': entry});
    });

    return ret;
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


    parseSemicolonSONobject: function(semicolonSONstr) {
      var str = semicolonSONstr;
      // array [[args-endings-with-body]]
      var argFuncBodies = getFunctionsFromSemicolonSON(str);
console.log(1);
console.log(argFuncBodies);
console.log(semicolonSONwithRemovedFuncDeclarations(str));
      // parsing string from which function declarations are removed:
      var retObj = parseSemicolonSONdebehaviorized(
        semicolonSONwithRemovedFuncDeclarations(str));

      argFuncBodies.forEach(function(funcDecl){
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

// array of objects to test
[
  ';key,value;methodName,|return true|;',
  ';key,value;methodName,|function (a) { return a + 1; }|;'
].forEach(
(function testSemicolonSONparse(test){
  console.log('**** Test semicolonSON *****');
  console.log(test);
  var parsedObj = STKit.parseSemicolonSONobject(test);
  console.log('"' + test + '" \n=> ');
  console.log(parsedObj);
  console.log('\n\n');
}));
