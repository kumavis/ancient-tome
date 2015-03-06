var WebWorkify = require('webworkify')
var WorkerStream = require('workerstream')
var workerDefinition = require('./worker.js')
var dnode = require('dnode')
var TwinBcrypt = require('twin-bcrypt')

module.exports = StorageCrypto

function StorageCrypto(secret, salt, cb) {

  var worker = WebWorkify(workerDefinition)
  var workerStream = WorkerStream(worker)
  var rpc = dnode()
  rpc.on('remote', function(cryptoWorker) {
    cryptoWorker.checkCompatability(function(isCompatible){
      if (isCompatible) {
        prepareApiObject(secret, salt, cryptoWorker, cb)
      } else {
        cb(new Error('Native crypto not supported in this browser (in webworkers).'))
      }
    })
  })
  workerStream.pipe(rpc).pipe(workerStream)

}

StorageCrypto.generateSalt = function(iterations) {
  iterations = iterations || 12
  return TwinBcrypt.genSalt(iterations)
}

function prepareApiObject(secret, salt, cryptoWorker, cb) {

  cryptoWorker.generateKeysFromSecret(secret, salt, function(error, keyPairId){

    if (error) return cb(error)

    var cryptographer = {
      encrypt: encrypt,
      decrypt: decrypt,
    }

    cb(null, cryptographer)

    function encrypt(srcText, cb) {
      cryptoWorker.encrypt(srcText, keyPairId, cb)
    }

    function decrypt(srcText, cb) {
      cryptoWorker.decrypt(srcText, keyPairId, cb)
    }

  })

}