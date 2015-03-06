var StorageCrypto = require('./index.js')
var async = require('async')

module.exports = secureLocalStorage

function secureLocalStorage(password, cb) {

  var salt = localStorage.getItem('cryptographer-salt')
  if (!salt) {
    salt = StorageCrypto.generateSalt()
    localStorage.setItem('cryptographer-salt', salt)
  }

  StorageCrypto(password, salt, onCryptoReady)

  function onCryptoReady(error, cryptographer) {

    var apiObject = {
      setItem: setItem,
      getItem: getItem,
      removeItem: removeItem,
    }

    cb(null, apiObject)

    function setItem(key, value, cb) {
      cb = cb || noop
      async.parallel([
        cryptographer.hmac.bind(null, key),
        cryptographer.encrypt.bind(null, value),
      ], function(error, results){
        if (error) return cb(error)
        var hashedKey = results[0]
        var encryptedValue = results[1]
        localStorage.setItem(hashedKey, encryptedValue)
        cb(null)
      })
    }

    function getItem(key, cb) {
      async.waterfall([
        cryptographer.hmac.bind(null, key),
        function(key, cb){ cb(null, localStorage.getItem(key)) },
        cryptographer.decrypt,
      ], cb)
    }

    function removeItem(key, cb) {
      localStorage.removeItem(key)
      process.nextTick(cb)
    }
  }

}

function noop(){}