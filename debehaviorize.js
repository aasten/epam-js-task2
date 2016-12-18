


/**
@param some object to debehaviorize
@returns debehaviorized object
*/
function debehaviorize(some) {
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
        ret[propName] = debehaviorize(some[propName]);
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
var da = debehaviorize(a);
console.log('After debehaviorizing');
console.log('original object:');
console.log(a);
console.log('debehaviorized object:');
console.log(da);
