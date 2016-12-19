module.exports = (function(){

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
    @param fn is function to be memoized
    @param maxEntries is an optional parameter of cache capacity
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

    /**
    @function parseSemicolonSONobject
    parsing js objects as followed:
    @example
    ";key,value;methodName,|return true|;" => { key: 'value',  method: function() {return true;} }
    ";key,value;methodName,|function (a) { return a + 1; }|;" => { key: 'value',  method: function(a) {return a + 1;} }
    @param str semicolonSON string
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
