var subtle = (global.crypto || global.mozCrypto || global.msCrypto).subtle
var TwinBcrypt = require('twin-bcrypt')
var ParentStream = require('workerstream/parent')
var dnode = require('dnode')
var async = require('async')
var Uuid = require('hat')

module.exports = setupWorker

var keyChain = {}


function setupWorker(){

  var parentStream = ParentStream()
  var rpc = dnode({
    checkCompatability: checkCompatability,
    generateKeysFromSecret: generateKeysFromSecret,
    encrypt: encrypt,
    decrypt: decrypt,
    hmac: hmac,
  })
  parentStream.pipe(rpc).pipe(parentStream)

}

// rpc methods

function checkCompatability(cb) {
  var compatable = Boolean(subtle && subtle.generateKey && subtle.exportKey && subtle.importKey)
  cb(compatable)
}

function generateKeysFromSecret(secret, salt, cb) {
  generateBcryptHash(secret, salt, function(error, hash){
    if (error) return cb(error)
    async.parallel([
      generateAesgcmKey.bind(null, hash),
      generateHmacKey.bind(null, hash),
    ], function(error, results){
      if (error) return cb(error)
      // store keys on keyChain (can't leave worker context)
      var uuid = Uuid()
      keyChain[uuid] = {
        encryption: results[0],
        hmac: results[1],
      }
      cb(null, uuid)
    })
  })
}

function encrypt(srcText, keyId, cb) {
  if (!keyChain[keyId]) return cb(new Error('No key for id "'+keyId+'".'))
  var key = keyChain[keyId].encryption
  // generate random meta data
  var keyDetails = {
    name: 'AES-GCM',
    iv: randomByteArray(16),
    additionalData: randomByteArray(256),
    tagLength: 128,
  }
  // encrypt
  var inputArrayBuffer = str2ab(srcText)
  var promise = subtle.encrypt(keyDetails, key, inputArrayBuffer)
  unpromise(promise, function(error, encryptedBuffer){
    if (error) return cb(error)
    try {
      var encryptedString = byteArray2str(new Uint8Array(encryptedBuffer))
      var storeData = JSON.stringify({
        keyDetails: serializeKeyDetails(keyDetails),
        data: encryptedString,
      })
      cb(null, storeData)
    } catch (error) {
      cb(error)
    }
  })
}

function decrypt(srcText, keyId, cb) {
  if (!keyChain[keyId]) return cb(new Error('No key for id "'+keyId+'".'))
  var key = keyChain[keyId].encryption
  try {
    // extract meta data
    var storeData = JSON.parse(srcText)
    var keyDetails = deserializeKeyDetails(storeData.keyDetails)
    var encryptedString = storeData.data
    // decrypt
    var inputArrayBuffer = str2byteArray(encryptedString).buffer
    var promise = subtle.decrypt( keyDetails, key, inputArrayBuffer)
    unpromise(promise, function(error, decryptedBuffer){
      if (error) return cb(error)
      var decryptedString = ab2str(decryptedBuffer)
      cb(null, decryptedString)
    })
  } catch (error) {
    cb(error)
  }
}

function hmac(srcText, keyId, cb) {
  try {
    if (!keyChain[keyId]) return cb(new Error('No key for id "'+keyId+'".'))
    var key = keyChain[keyId].hmac
    // encrypt
    var inputArrayBuffer = str2ab(srcText)
    var promise = subtle.sign({ name: "HMAC" }, key, inputArrayBuffer)
    unpromise(promise, function(error, signedBuffer){
      if (error) return cb(error)
      try {
        var signedString = ab2str(signedBuffer)
        cb(null, signedString)
      } catch (error) {
        cb(error)
      }
    })
  } catch (error) {
    cb(error)
  }
}

// util

function generateBcryptHash(secret, salt, cb) {
  try {
    TwinBcrypt.hash(secret, salt, function(hash){
      cb(null, Buffer(hash))
    })
  } catch (error) {
    cb(error)
  }
}

function generateAesgcmKey(hash, cb) {
  try {
    var seedBuffer = hash.slice(0, 32)
    var promise = subtle.importKey('raw', seedBuffer, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
    unpromise(promise, cb)
  } catch (error) {
    cb(error)
  }
}

function generateHmacKey(hash, cb) {
try {
    var seedBuffer = hash.slice(0, 32)
    var promise = subtle.importKey('raw', seedBuffer, { name: 'HMAC', hash: {name: 'SHA-256'} }, false, ['sign'])
    unpromise(promise, cb)
  } catch (error) {
    cb(error)
  }
}

function serializeKeyDetails(keyDetails){
  return {
    name: keyDetails.name,
    tagLength: keyDetails.tagLength,
    iv: byteArray2str(keyDetails.iv),
    additionalData: byteArray2str(keyDetails.additionalData),
  }
}

function deserializeKeyDetails(data){
  return {
    name: data.name,
    tagLength: data.tagLength,
    iv: str2byteArray(data.iv),
    additionalData: str2byteArray(data.additionalData),
  }
}

function randomByteArray(size) {
  return global.crypto.getRandomValues(new Uint8Array(size))
}

function byteArray2str(byteArray) {
  return Buffer._augment(byteArray).toString('base64')
}

function str2byteArray(str) {
  return new Uint8Array(Buffer(str, 'base64').toArrayBuffer())
}

function ab2str(arrayBuffer) {
  return Buffer(new Uint8Array(arrayBuffer)).toString('utf8')
}

function str2ab(str) {
  return Buffer(str, 'utf8').toArrayBuffer()
}

function ab2Buffer(ab) {
  var buffer = new Buffer(ab.byteLength);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buffer.length; ++i) {
      buffer[i] = view[i];
  }
  return buffer;
}

function randomByteArray(size) {
  return global.crypto.getRandomValues(new Uint8Array(size))
}

function unpromise (p, cb) {
  p.then(function (r) { cb(null, r) })
  p.catch(function (err) { cb(err) })
}