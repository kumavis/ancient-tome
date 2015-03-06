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
  var start = new Date()
  console.log('encrypt')
  if (!keyChain[keyId]) return cb(new Error('No key for id "'+keyId+'".'))
  var key = keyChain[keyId].encryption
  // generate random meta data
  var keyDetails = {
    name: 'AES-GCM',
    iv: randomTypedArray(16),
    additionalData: randomTypedArray(256),
    tagLength: 128,
  }
  // encrypt
  var inputArrayBuffer = str2ab(srcText)
  var promise = subtle.encrypt(keyDetails, key, inputArrayBuffer)
  unpromise(promise, function(error, encryptedBuffer){
    if (error) return cb(error)
    try {
      var encryptedString = ab2str(encryptedBuffer)
      var storeData = JSON.stringify({
        keyDetails: keyDetails,
        data: encryptedString,
      })
      console.log('encrypt:', new Date() - start)
      cb(null, storeData)
    } catch (error) {
      cb(error)
    }
  })
}

function decrypt(srcText, keyId, cb) {
  var start = new Date()
  console.log('decrypt')
  if (!keyChain[keyId]) return cb(new Error('No keyPair for id "'+keyId+'".'))
  var keyPair = keyChain[keyId].encryption
  try {
    // extract meta data
    var storeData = JSON.parse(srcText)
    var keyDetails = storeData.keyDetails
    // normalize values (typed arrays dont deserialize correctly)
    keyDetails.iv = normalizeTypedArray(keyDetails.iv)
    keyDetails.additionalData = normalizeTypedArray(keyDetails.additionalData)
    var encryptedString = storeData.data
    // decrypt
    var inputArrayBuffer = str2ab(encryptedString)
    var promise = subtle.decrypt(keyDetails, keyPair, inputArrayBuffer)
    unpromise(promise, function(error, decryptedBuffer){
      if (error) return cb(error)
      var decryptedString = ab2str(decryptedBuffer)
      console.log('decrypt:', new Date() - start)
      cb(null, decryptedString)
    })
  } catch (error) {
    cb(error)
  }
}

function hmac(srcText, keyId, cb) {
  var start = new Date()
  console.log('hmac')
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
        console.log('hmac:', new Date() - start)
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

function unpromise (p, cb) {
  p.then(function (r) { cb(null, r) })
  p.catch(function (err) { cb(err) })
}