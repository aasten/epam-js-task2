var STKit = require('./stkit.js');
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
  STKit.parseSemicolonSONobject = STKit.memoized(STKit.parseSemicolonSONobject);
  var beginMemoized = new Date();
  sampleSemicolonSONs.forEach(testSemicolonSONparse);
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

  console.log('second attempt, checking processor caching etc...');
  beginRaw = new Date();

  console.log('unmemoizedFibonacci(' + fibFor + ')=' + testFunc(fibFor));

  endRaw = new Date();

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
