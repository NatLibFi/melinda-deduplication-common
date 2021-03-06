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

export function executeTransaction(sequence, additionalRollbackActions) {
  const additionalRollbacksToRun = additionalRollbackActions || [];

  const rollbacks = [];

  return new Promise((resolve, reject) => {
    let chain;
    const results = [];
    sequence.forEach((transactionStepDefinition, i) => {
      if (i === 0) {
        chain = step(transactionStepDefinition)();
      } else {
        chain = chain.then(result => {
          results.push(result);
          return step(transactionStepDefinition)();
        });
      }
    });

    chain.then(lastResult => {
      results.push(lastResult);
      resolve(results);
    }).catch(error => {
      let rollbacksToRun = error.rollbacks || [];
      rollbacksToRun = rollbacksToRun.concat(additionalRollbacksToRun);

      if (rollbacksToRun.length > 0) {
        // Do a rollback

        executeRollbacks(rollbacksToRun)
          .then(() => reject(error)) // Error, but rollback was success
          .catch(error => {
            const rollbackError = new RollbackError(error.message);
            reject(rollbackError);
          });
      } else {
        reject(error);
      }
    });
  });

  // Transaction step
  function step(fn) {
    return function () {
      return fn.action()
        .then(result => {
          if (fn.rollback) {
            rollbacks.unshift(fn.rollback.bind(null, result));
          }
          return result;
        })
        .catch(error => {
          // Add rollbackinfo to error
          error.rollbacks = rollbacks;
          throw error;
        });
    };
  }
}

function executeRollbacks(rollbackSequence) {
  return new Promise((resolve, reject) => {
    const inital = Promise.resolve();

    rollbackSequence.reduce((acc, rollbackFn) => {
      return acc.then(() => rollbackFn()).catch(e => reject(e));
    }, inital).then(resolve);
  });
}

export function RollbackError(message) {
  this.name = 'RollbackError';
  this.message = message || 'Rollback failed';
}
RollbackError.prototype = Object.create(Error.prototype);
RollbackError.prototype.constructor = RollbackError;
