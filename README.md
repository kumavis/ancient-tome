# Ancient Tome

[![Greenkeeper badge](https://badges.greenkeeper.io/kumavis/ancient-tome.svg)](https://greenkeeper.io/)

A simple tool for storing secrets.

### warning

This is under development and has not been audited yet.
Currently uses the WebCrypto API, so it only works in modern browsers.

### Crypto flow:

These are the cryptograph flows used by AncientTome:

```
init: salt + password --(bcrypt)--> hash --(AES-GCM)--> AES key
init: salt + password --(bcrypt)--> hash --(HMAC+SHA256)--> HMAC key
obfuscate keys: plainText --(HMAC+SHA256)--> cypherText
encrypt values: plainText --(AES-GCM)--> cypherText
```

The salt is randomly generated on first use and stored in plaintext.
The password is provided by the user and stored in their head.


### Usage:

##### localStorage

If you want to use `localStorage` a wrapper is provided for you.
While `localStorage` is synchronous, encryption is asynchronous,
so read methods require a callback.
Write methods have an optional callback called on completion.

```js
var AncientLocal = require('ancient-tome/local')

var secureLocalStorage = AncientLocal()

secureLocalStorage.open(password, function(error) {

  secureLocalStorage.setItem('journal', 'dear diary...', function(err){ ... })
  secureLocalStorage.getItem('bank info', function(err, plaintext){ ... })

})
```

##### Custom Storage

You can use whatever key-value storage mechanism you want.
Reading non-existant keys should return a falsy value, not error.
The first argument of callbacks should be the error or a falsy value.
Here is a custom storage example:

```js
var AncientTome = require('ancient-tome')

var myTome = AncientTome()

myTome._get = function(key, cb){ ... }
myTome._set = function(key, value, cb){ ... }
myTome._remove = function(key, cb){ ... }
```

### Extras:

With obfuscated keys, its hard to keep track of what's been stored.
Use the `TomeIndexer` to augment a tome with a simple index.
Be sure to do this after if you are overriding get/set methods.

```js
var AncientTome = require('ancient-tome')
var TomeIndexer = require('ancient-tome/indexer')

var myTome = AncientTome()
TomeIndexer(myTome)

myTome.open(password, function(){
  myTome.index() //=> ['journal', 'bank info']
})
```