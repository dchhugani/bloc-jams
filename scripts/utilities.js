var forEach = function(array, callback) {
    var i;
    
    for (i = 0; i < array.length; i++) {
      callback(array[i]);
    }
}