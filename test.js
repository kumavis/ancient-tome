var assert = require('assert')
Cryptographer = require('./index.js')

var inputText = 'hello nsa'

setupSimpleEncrypt('password1234', function(error, apiObject){
  console.log('end')
  console.log(arguments)
  var start = new Date()
  require('async').waterfall([
    apiObject.encrypt.bind(null, inputText),
    apiObject.decrypt,
  ], function(error, result){
    console.log(arguments)
    console.log('round trip:', new Date() - start)
    assert(inputText === result)
  })
})