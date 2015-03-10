var StorageCrypto = require('./crypto.js')
var async = require('async')

module.exports = AncientTome

function AncientTome() {
  if (!(this instanceof AncientTome)) return new AncientTome()
}

var proto = AncientTome.prototype

var ancientTomeSaltKey = 'ancient-tome-salt'

// public methods

proto.open = function(password, cb){

  var _this = this

  async.waterfall([
    readSalt,
    confirmSalt,
    initializeCrypto,
    onCryptoReady,
  ])

  function readSalt(cb) {
    _this._get(ancientTomeSaltKey, cb)
  }

  function confirmSalt(salt, cb) {
    if (!salt) {
      salt = StorageCrypto.generateSalt()
      _this._set('ancient-tome-salt', salt, function(err){
        if (err) return cb(err)
        cb(null, salt)
      })
    } else {
      cb(null, salt)
    }
  }

  function initializeCrypto(salt, cb) {
    StorageCrypto(password, salt, cb)
  }

  function onCryptoReady(crypto) {
    _this._crypto = crypto
    cb(null)
  }

}

proto.get = function(key, cb) {
  var _this = this
  if (!_this._crypto) return cb(notInitialized())

  async.waterfall([
    _this._crypto.hmac.bind(null, key),
    _this._get.bind(_this),
    _this._crypto.decrypt,
  ], cb)

}

proto.set = function(key, value, cb) {
  var _this = this
  if (!_this._crypto) return cb ? cb(notInitialized()) : notInitialized()
  cb = cb || noop

  async.parallel([
    _this._crypto.hmac.bind(null, key),
    _this._crypto.encrypt.bind(null, value),
  ], function(err, results){
    if (err) return cb(err)
    var hashedKey = results[0]
    var encryptedValue = results[1]
    _this._set(hashedKey, encryptedValue, cb)
  })
}

proto.remove = function(key, cb) {
  var _this = this
  if (!_this._crypto) return cb ? cb(notInitialized()) : notInitialized()
  cb = cb || noop

  async.waterfall([
    _this._crypto.hmac.bind(null, key),
    _this._remove.bind(_this, key),
  ], cb)
}

// private methods

proto._get = notImplemented
proto._set = notImplemented
proto._remove = notImplemented

// util

function noop(){}

function notImplemented(){
  throw new Error('Method not implemented.')
}

function notInitialized(){
  throw new Error('LocalTome not opened.')
}