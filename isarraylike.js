/**
filterPositiveInt() function 0,1,2,...
idea taken from https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/parseInt
*/
function filterPositiveInt(value) {
  if(/^([0-9]+)$/.test(value))
    return Number(value);
  return NaN;
}

function isArrayLike(obj) {
  for(var prop in obj) {
    if(!isNaN(filterPositiveInt(prop))) {
      return true;
    }
  }
  return false;
}


console.log(isArrayLike([1,2,3]));
var a = [];
a[-1] = 1;
console.log(isArrayLike(a));
