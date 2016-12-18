var STKit = (function(){

  return {
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
      return Object.prototype.hasOwnProperty.call(obj,'length');
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

  42
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
