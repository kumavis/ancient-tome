var test = require('tape')
var LocalAncient = require('../local')
var TomeIndexer = require('../indexer')

var password = 'password123'
var inputText = 'dear diary, 今日は楽しかったです。'

test('localStorage', function (t) {

  t.plan(7)
  clearLocalStorage()

  var localAncient = TomeIndexer(LocalAncient())

  localAncient.open(password, function(error) {

    t.notOk(error)

    localAncient.set('journal', inputText, function(error){

      t.notOk(error)
      t.equal( localAncient.index().length, 1, 'one item in index' )

      localAncient.set('other', 'nothing', function(error){

        t.notOk(error)
        t.equal( localAncient.index().length, 2, 'two items in index' )

        localAncient.remove('other', function(error){

          t.notOk(error)
          t.equal( localAncient.index().length, 1, 'one item in index' )

        })

      })
    })

  })

})

function clearLocalStorage() {
  for (var key in localStorage) {
    localStorage.removeItem(key)
  }
}