var async = require('async')

module.exports = TomeIndexer


var ancientTomeIndexKey = 'ancient-tome-index'

function TomeIndexer(tome) {
  // extract original methods
  var _open = tome.open
  var _set = tome.set
  var _get = tome.get
  var _remove = tome.remove
  // overwrite methods
  tome.open = open
  tome.set = set
  tome.remove = remove
  // add new methods
  tome.index = index
  // local variables
  var indexOfKeys = undefined

  return tome

  // open the storage
  // then read the index into memory
  function open(password, cb){
    async.series([
      _open.bind(tome, password),
      _get.bind(tome, ancientTomeIndexKey),
    ], function(err, results){
      if (err) return cb(err)
      var storedIndex = results[1]
      indexOfKeys = storedIndex ? JSON.parse(storedIndex) : []
      cb()
    })
  }

  // set value normally
  // and update index
  function set(key, value, cb){
    indexOfKeys.push(key)
    async.parallel([
      _set.bind(tome, key, value),
      updateIndex,
    ], function(err, results){
      cb(err, results[0])
    })
  }

  // remove key normally
  // and update index
  function remove(key, cb){
    removeFromArray(key, indexOfKeys)
    async.parallel([
      _remove.bind(tome, key),
      updateIndex,
    ], function(err, results){
      cb(err, results[0])
    })
  }

  // return a copy of the indexed keys
  function index() {
    return indexOfKeys.slice()
  }

  function updateIndex(cb) {
    _set.call(tome, ancientTomeIndexKey, JSON.stringify(indexOfKeys), cb)
  }

}


function removeFromArray(item, array) {
  var index = array.indexOf(item)
  if (index !== -1) {
    array.splice(index, 1)
  }
}