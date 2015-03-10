var AncientTome = require('./index.js')
var nextTick = process.nextTick

module.exports = AncientLocal


function AncientLocal() {
  var ancientLocal = AncientTome()
  // implement required methods
  ancientLocal._get = get
  ancientLocal._set = set
  ancientLocal._remove = remove
  // add localStorage-style methods
  ancientLocal.getItem = ancientLocal.get.bind(ancientLocal)
  ancientLocal.setItem = ancientLocal.set.bind(ancientLocal)
  ancientLocal.removeItem = ancientLocal.remove.bind(ancientLocal)
  return ancientLocal
}

function get(key, cb){
  var value = localStorage.getItem(key)
  nextTick(cb.bind(null, null, value))
}

function set(key, value, cb){
  localStorage.setItem(key, value)
  nextTick(cb)
}

function remove(key, cb){
  localStorage.removeItem(key)
  nextTick(cb)
}