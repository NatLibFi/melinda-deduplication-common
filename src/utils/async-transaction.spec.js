// @flow
/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * Shared modules for microservices of Melinda deduplication system
 *
 * Copyright (c) 2017 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of melinda-deduplication-common
 *
 * melinda-deduplication-common is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * melinda-deduplication-common is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 **/

/* jshint mocha:true */
'use strict';

const chai = require('chai');
const sinon = require('sinon');

const expect = chai.expect;
const assert = chai.assert;

const {executeTransaction, RollbackError} = require('./async-transaction');

describe('transcation', () => {
  it('should run actions and result in OK if all is well', done => {
    const sequence = [
      {action: successFn('del1'), rollback: successFn('undel1')},
      {action: successFn('del2'), rollback: successFn('undel2')},
      {action: successFn('merge'), rollback: undefined}
    ];

    executeTransaction(sequence).then(res => {
      try {
        assert(true, 'Success callback should be called when everyting is ok');
        expect(res).to.eql(['del1', 'del2', 'merge']);

        done();
      } catch (e) {
        done(e);
      }
    }, error => {
      if (error.name == 'AssertionError') {
        done(error);
      }
      done(new Error('Error callback should not be called when everyting is ok'));
    });
  });

  it('should rollback on error and tell what failed', done => {
    const sequence = [
      {action: successFn('del1'), rollback: successFn('undel1')},
      {action: successFn('del2'), rollback: successFn('undel2')},
      {action: failingFn('merge'), rollback: undefined}
    ];

    executeTransaction(sequence)
      .then(onFulfilledMustNotBeCalled(done))
      .catch(error => {
        if (error.name == 'AssertionError') {
          done(error);
        }
        expect(error.message).to.equal('merge');
        done();
      });
  });

  it('should run additional rollbacks', done => {
    const additionalRollback = sinon.spy(successFn('extrarollbackaction'));

    const sequence = [
      {action: successFn('del1'), rollback: successFn('undel1')},
      {action: successFn('del2'), rollback: successFn('undel2')},
      {action: failingFn('merge'), rollback: undefined}
    ];

    executeTransaction(sequence, [additionalRollback])
      .then(onFulfilledMustNotBeCalled(done))
      .catch(catchHandler(error => {
        expect(additionalRollback).to.have.been.calledOnce;
        expect(error.message).to.equal('merge');
        done();
      }, done));
  });

  it('should give action response to rollback function as parameter', done => {
    const rollback1 = sinon.spy(successFn('undel1'));
    const rollback2 = sinon.spy(successFn('undel2'));

    const sequence = [
      {action: successFn('del1'), rollback: rollback1},
      {action: successFn('del2'), rollback: rollback2},
      {action: failingFn('merge'), rollback: undefined}
    ];

    executeTransaction(sequence)
      .then(onFulfilledMustNotBeCalled(done))
      .catch(error => {
        if (error.name == 'AssertionError') {
          done(error);
        }

        try {
          expect(rollback1.getCall(0).args).to.eql(['del1']);
          expect(rollback2.getCall(0).args).to.eql(['del2']);
          expect(error.message).to.equal('merge');
          done();
        } catch (e) {
          done(e);
        }
      });
  });

  it('should stop execution on first error', done => {
    const sequence = [
      {action: successFn('del1'), rollback: successFn('undel1')},
      {action: failingFn('del2'), rollback: successFn('undel2')},
      {action: successFn('merge'), rollback: undefined}
    ];

    executeTransaction(sequence)
      .then(onFulfilledMustNotBeCalled(done))
      .catch(error => {
        if (error.name == 'AssertionError') {
          done(error);
        }

        expect(error.message).to.equal('del2');

        done();
      });
  });

  it('should throw a RollbackError if rollback fails', done => {
    const sequence = [
      {action: successFn('del1'), rollback: failingFn('undel1')},
      {action: successFn('del2'), rollback: successFn('undel2')},
      {action: failingFn('merge'), rollback: undefined}
    ];

    executeTransaction(sequence)
      .then(onFulfilledMustNotBeCalled(done))
      .catch(catchHandler(error => {
        expect(error).to.be.instanceof(RollbackError);
        expect(error.message).to.equal('undel1');
        done();
      }, done));
  });
});

function catchHandler(fn, done) {
  return function (error) {
    if (error.name == 'AssertionError') {
      done(error);
    }
    try {
      fn(error);
    } catch (error) {
      done(error);
    }
  };
}

describe('RollbackError', () => {
  it('should be accessible', () => {
    expect(RollbackError).to.be.a('function');
  });
  it('should have default message if message not fiven', () => {
    const rollbackError = new RollbackError();
    expect(rollbackError.message).to.equal('Rollback failed');
  });
});

function successFn(text) {
  return function () {
    return asyncFunc(text);
  };
}

function failingFn(text) {
  return function () {
    return asyncFail(text);
  };
}

function asyncFunc(text) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(text);
    }, 5);
  });
}

function asyncFail(text) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(text));
    }, 5);
  });
}

function onFulfilledMustNotBeCalled(done) {
  return res => done(new Error('Success callback was run on error case. Result was: ' + res));
}
