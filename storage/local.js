var StorageCrypto = require('./index.js')

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
      cryptographer.encrypt(value, function(error, encryptedString){
        if (error) return cb(error)
        localStorage.setItem(key, encryptedString)
        cb(null, encryptedString)
      })
    }

    function getItem(key, cb) {
      var encryptedString = localStorage.getItem(key)
      cryptographer.decrypt(encryptedString, cb)
    }

    function removeItem(key, cb) {
      localStorage.removeItem(key)
      process.nextTick(cb)
    }
  }

}

function noop(){}