var subtle = (global.crypto || global.mozCrypto || global.msCrypto).subtle
var TwinBcrypt = require('twin-bcrypt')
var ParentStream = require('workerstream/parent')
var dnode = require('dnode')
var async = require('async')
var memoize = require('memoizee')

module.exports = setupWorker

function setupWorker(){

  var parentStream = ParentStream()
  var rpc = dnode({
    checkCompatability: checkCompatability,
    encrypt: encrypt,
    decrypt: decrypt,
  })
  parentStream.pipe(rpc).pipe(parentStream)

}

var keysFromSecret = memoize(generateKeysFromSecret, { async: true })
// var keysFromSecret = generateKeysFromSecret

function checkCompatability(cb) {
  var compatable = Boolean(subtle && subtle.generateKey && subtle.exportKey && subtle.importKey)
  cb(compatable)
}

function encrypt(srcText, secret, cb) {
  var start = new Date()
  console.log('encrypt')
  var keyDetails = {
    name: 'AES-GCM',
    salt: TwinBcrypt.genSalt(12),
    iv: randomTypedArray(16),
    additionalData: randomTypedArray(256),
    tagLength: 128,
  }
  keysFromSecret(secret, keyDetails.salt, function(error, keyPair){
    var inputArrayBuffer = str2ab(srcText)
    var promise = subtle.encrypt(keyDetails, keyPair, inputArrayBuffer)
    unpromise(promise, function(error, encryptedBuffer){
      if (error) return cb(error)
      try {
        var encryptedString = ab2str(encryptedBuffer)
        var storeData = JSON.stringify({
          keyDetails: keyDetails,
          data: encryptedString,
        })
        console.log('encrypt keys:', new Date() - start)
        cb(null, storeData)
      } catch (error) {
        cb(error)
      }
    })
  })
}

function decrypt(srcText, secret, cb) {
  var start = new Date()
  console.log('decrypt')
  try {
    // extract data
    var storeData = JSON.parse(srcText)
    var keyDetails = storeData.keyDetails
    // normalize values (typed arrays dont deserialize correctly)
    keyDetails.iv = normalizeTypedArray(keyDetails.iv)
    keyDetails.additionalData = normalizeTypedArray(keyDetails.additionalData)
    var encryptedString = storeData.data
    // generate keys
    keysFromSecret(secret, keyDetails.salt, function(error, keyPair){
      var inputArrayBuffer = str2ab(encryptedString)
      console.log('decrypting...')
      var promise = subtle.decrypt(keyDetails, keyPair, inputArrayBuffer)
      unpromise(promise, function(error, decryptedBuffer){
        if (error) return cb(error)
        var decryptedString = ab2str(decryptedBuffer)
        console.log('decrypt keys:', new Date() - start)
        cb(null, decryptedString)
      })
    })
  } catch (error) {
    cb(error)
  }
}

// util

function unpromise (p, cb) {
  p.then(function (r) { cb(null, r) })
  p.catch(function (err) { cb(err) })
}

function generateKeysFromSecret(secret, salt, cb) {
  async.waterfall([
    generateHash.bind(null, secret, salt),
    generateKey.bind(null),
  ], cb)
}

function generateHash(secret, salt, cb) {
  try {
    TwinBcrypt.hash(secret, salt, function(hash){
      cb(null, hash)
    })
  } catch (error) {
    cb(error)
  }
}

function generateKey(hash, cb) {
  try {
    var seedBuffer = Buffer(hash).slice(0, 32)
    var promise = subtle.importKey('raw', seedBuffer, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
    unpromise(promise, cb)
  } catch (error) {
    cb(error)
  }
}

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function randomTypedArray(size) {
  return global.crypto.getRandomValues(new Uint8Array(size))
}

function normalizeTypedArray(arr) {
  var len = Object.keys(arr).length
  arr.length = len
  return new Uint8Array(arr)
}