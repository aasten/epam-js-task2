var STKit = require('./stkit.js');
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
