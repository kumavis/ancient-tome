var test = require('tape')
var LocalAncient = require('../local')

var password = 'password123'
var inputText = 'dear diary, 今日は楽しかったです。'
localStorage.removeItem('journal')

test('localStorage', function (t) {
  t.plan(5)

  var localAncient = LocalAncient()
  localAncient.open(password, function(error) {

    t.notOk(error)

    localAncient.setItem('journal', inputText, function(error){

      t.notOk(error)
      t.notOk( localStorage.getItem('journal'), 'key doesnt seem to leak' )

      localAncient.getItem('journal', function(error, plaintext){

        t.notOk(error)
        t.equal(plaintext, inputText, 'encrypted text roundtrips correctly')

      })
    })

  })
})