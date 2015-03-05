var WebWorkify = require('webworkify')
var WorkerStream = require('workerstream')
var workerDefinition = require('./worker.js')
var dnode = require('dnode')

module.exports = setupSimpleEncrypt

setupSimpleEncrypt('password1234', function(error, apiObject){
  console.log('end')
  console.log(arguments)
  var start = new Date()
  require('async').waterfall([
    apiObject.encrypt.bind(null, 'haay wuurl'),
    apiObject.decrypt,
  ], function(error, result){
    console.log(arguments)
    console.log('round trip:', new Date() - start)
  })
})

function setupSimpleEncrypt(secret, cb) {

  var worker = WebWorkify(workerDefinition)
  var workerStream = WorkerStream(worker)
  var rpc = dnode()
  rpc.on('remote', function(crytographer) {
    crytographer.checkCompatability(function(isCompatible){
      if (isCompatible) {
        var simpleEncrypt = prepareApiObject(secret, crytographer)
        cb(null, simpleEncrypt)
      } else {
        cb(new Error('Native crypto not supported in this browser (in webworkers).'))
      }
    })
  })
  workerStream.pipe(rpc).pipe(workerStream)

}

function prepareApiObject(secret, crytographer) {
  return {
    encrypt: encrypt,
    decrypt: decrypt,
  }

  function encrypt(srcText, cb) {
    crytographer.encrypt(srcText, secret, cb)
  }

  function decrypt(srcText, cb) {
    crytographer.decrypt(srcText, secret, cb)
  }
}