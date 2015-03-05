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

```js
var Cryptographer = require('cryptographer')

/*
    The user needs to remember their password,
  and you need to keep track of their salt.
  The salt is a special random string that
  doesn't reveal anything, so you can store
  it as is. You'll need to provide both the
  salt and the password to lock or unlock something.
    The first time you want to lock or unlock something
  you'll need to create a salt and store that somewhere.
  Its important that each user has a different salt so
  that an attacker can't build a generic attack against
  all of your users.
*/

var salt = localStorage.getItem('encryption-salt')
if (!salt) {
  salt = Cryptographer.generateSalt()
  localStorage.setItem('encryption-salt', salt)
}

var cryptographer

;(function(){
  var password
  while (!isValidPassword(password)) {
    password = prompt('Enter your password:')
  }
  cryptographer = Cryptographer.init(password, salt)
})()

function isValidPassword(password) {
  if (!password) return false
  if ('string' !== typeof password) return false
  if (password.length < 6) return false
  // add other requirements here
  return true
}

cryptographer.encrypt('dear diary...', function(err, encryptedString){
  localStorage.setItem('journal', encryptedString)
})
```