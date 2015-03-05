// var easyEncrypt = require('easy-encrypt')
var easyEncrypt = require('./index.js')

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
  salt = easyEncrypt.generateSalt()
  localStorage.setItem('encryption-salt', salt)
}

;(function(){
  var password
  while (!isValidPassword(password)) {
    password = prompt('Enter your password:')
  }
  var cryptographer = easyEncrypt.init(password, salt)
})()

function isValidPassword(password) {
  if (!password) return false
  if ('string' !== typeof password) return false
  if (password.length < 6) return false
  // add other requirements here
  return true
}

cryptographer.encrypt('hello nsa', function(err, encryptedString){
  localStorage.setItem('my secret', encryptedString)
})