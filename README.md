# Cryptographer

A suite of simple tools for keeping secrets and respecting privacy.

In this world there are many ways to keep important information from prying eyes.
Each of these techiniques are specialized for different usecases, there is no real
practical general solution. Instead of providing all the fundamentals and hoping
you know how to put the correct pieces together, we will provide a couple solutions
for common cases.

#### For storage

Certain ciphers are weak against analysis attacks when comparing similar source text
encrypted with the same parameters. For storage like a datastore where similar data
may be written over and over again, we employ ciphers that are strong against these
kind of attacks.


####### localStorage

If you want to use `localStorage` we provide a helper for you.
It will manage the user's salt for you by storing it in localStorage
as 'cryptographer-salt'.

```js
var SecureLocalStorage = require('cryptographer/storage/local')


askUserForPassword(function(error, password){
  console.log('got password!')
  SecureLocalStorage(password, onCryptoReady)
})

function onCryptoReady(error, secureLocalStorage) {
  console.log('ready for crypto!')
  var srcText = 'dear diary...'
  secureLocalStorage.setItem('journal', srcText)
}

function askUserForPassword(cb) {
  var password
  while (!isValidPassword(password)) {
    password = prompt('Enter your password:')
  }
  cb(null, password)
}

function isValidPassword(password) {
  if (!password) return false
  if ('string' !== typeof password) return false
  if (password.length < 6) return false
  // add other requirements here
  return true
}

```

####### Custom Storage

You can use whatever key-value storage mechanism you want.
If you choose this route, you must manage the salt yourself.
Don't worry, this is easy.
Here is a custom storage example:

```js
var StorageCrypto = require('cryptographer/storage')


var salt = localStorage.getItem('encryption-salt')
if (!salt) {
  salt = StorageCrypto.generateSalt()
  localStorage.setItem('encryption-salt', salt)
}

askUserForPassword(function(error, password){
  console.log('got password!')
  StorageCrypto(password, salt, onCryptoReady)
})

function onCryptoReady(error, cryptographer) {
  console.log('ready for crypto!')
  var srcText = 'dear diary...'
  cryptographer.encrypt(srcText, function(error, encryptedString){
    localStorage.setItem('journal', encryptedString)
  })
}

function askUserForPassword(cb) {
  var password
  while (!isValidPassword(password)) {
    password = prompt('Enter your password:')
  }
  cb(null, password)
}

function isValidPassword(password) {
  if (!password) return false
  if ('string' !== typeof password) return false
  if (password.length < 6) return false
  // add other requirements here
  return true
}

```