const mocha = require('mocha')
const chai = require('chai')

var assert = chai.assert

describe('Mocha', function () {
  it ('should return true', function () {
    assert.equal(1, 1)
  })
})
