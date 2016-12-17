;

// var debug = 0;

/**
Followed two functions copied from https://gist.github.com/pbakondy/e27b08f20cc34c730355
*/
// function copyObject(orig, deep) {
//     // 1. copy has same prototype as orig
//     var copy = Object.create(Object.getPrototypeOf(orig));
//
//     // 2. copy has all of orig’s properties
//     copyOwnPropertiesFrom(copy, orig, deep);
//
//     return copy;
// }
// function copyOwnPropertiesFrom(target, source, deep) {
//     Object.getOwnPropertyNames(source)
//     .forEach(function(propKey) {
//         var desc = Object.getOwnPropertyDescriptor(source, propKey);
//         Object.defineProperty(target, propKey, desc);
//         if (deep && typeof desc.value === 'object') {
//           target[propKey] = copyObject(source[propKey], deep);
//         }
//     });
//     return target;
// }


function debehaviorize(some) {
  if(!(some instanceof Object)) {
    // console.log(some + ' is not an instance of Object, it is ' + typeof some);
    return [];
  }
  // var ret = JSON.parse(JSON.stringify(some));
  // var ret = copyObject(some,true);
  var ret = [];
  for(var propName in some) {
    if(some.hasOwnProperty(propName)) {
      // console.log('loop:' + propName + ' is ' + (typeof ret[propName]));
      if(typeof some[propName] === 'function') {
        console.log(propName + ' is a function in ' + some)
        if(Object.isFrozen(some)) {
          throw ' is frozen, can\'t debehaviorize';
        }
        if(Object.isSealed(some)) {
          throw ' is sealed, can\'t debehaviorize';
        }
        ret.push(some[propName]);
        console.log(ret);
        delete some[propName];
      } else {
        // console.log('trying to debehaviorize ' + propName);
        try {
          // ret[propName] = debehaviorize(ret[propName]);
          ret.concat(debehaviorize(some[propName]));
        } catch(e) {
          // prepending outer property name
          e = '.' + propName + e;
          throw e;
        }
      }
    }
  }
  return ret;
}

var a = { n: 1, a: 'a',
  complex: { obj: { x: function() {console.log('i am a function');} } }};
// Object.freeze(a.complex.obj);
// Object.seal(a.complex.obj);
console.log(a);
// console.log('"a":' + JSON.stringify(a));
try {
var behavior = debehaviorize(a);
console.log('After debehaviorizing');
console.log('a:');
console.log(a);
console.log('behavior:');
console.log(behavior);
} catch(e) {
  console.log('Exception occured while debehaviorizing ' + JSON.stringify(a) + '\n: ' + e);
}
