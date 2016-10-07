'use strict';
/* global describe,it */

describe('index', function () {
  it('does not throw', function () {
    function req () {
      return require('../../index');
    }

    req.should.not.throw();
  });
});
