# Cryptographer

A suite of simple tools for keeping secrets and respecting privacy.


#### For storage

Crypto flow:

init: `salt + password --(bcrypt)--> hash --(AES-GCM)--> key pair`
encrypt: `plainText --(AES-GCM)--> cypherText`
decrypt: `cypherText --(AES-GCM)--> plainText`

####### localStorage

If you want to use `localStorage` we provide a helper for you.
It will manage the user's salt for you by storing it in localStorage
as 'cryptographer-salt'.

```js
var SecureLocalStorage = require('cryptographer/storage/local')


SecureLocalStorage(password, function(error, secureLocalStorage) {

  secureLocalStorage.setItem('journal', 'dear diary...', function(){ ... })
  secureLocalStorage.getItem('bank info', function(error, plaintext){ ... })

})
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

StorageCrypto(password, salt, function(error, cryptographer) {
  cryptographer.encrypt('dear diary...', function(error, encryptedString){
    localStorage.setItem('journal', encryptedString)
  })
}
```