var SecureLocalStorage = require('./storage/local')

var password = 'password123'
var inputText = 'dear diary...'
localStorage.removeItem('journal')

SecureLocalStorage(password, function(error, secureLocalStorage) {

  console.log('input:', inputText)
  secureLocalStorage.setItem('journal', inputText, function(){
    console.log('key leak?', !!localStorage.getItem('journal'))
    secureLocalStorage.getItem('journal', function(error, plaintext){
      console.log('match?', plaintext === inputText)
    })
  })

})