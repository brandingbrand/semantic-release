'use strict';

const _          = require('lodash');
const auto       = require('run-auto');
const semver     = require('semver');
const getType    = require('./lib/type');
const getCommits = require('./lib/commits');

module.exports = function(config, cb) {
  let plugins = config.plugins;

  auto({
    lastRelease: plugins.getLastRelease.bind(null, config),
    commits    : ['lastRelease', function(results, cb) {
      getCommits(_.assign({
          lastRelease: results.lastRelease
        }, config),
        cb);
    }],
    type       : ['commits', 'lastRelease', function(results, cb) {
      getType(_.assign({
          commits    : results.commits,
          lastRelease: results.lastRelease
        }, config),
        cb);
    }]
  }, function(err, results) {
    if (err) {
      return cb(err);
    }

    let nextRelease = {
      type   : results.type,
      version: results.type === 'initial'
        ? '1.0.0'
        : semver.inc(results.lastRelease.version, results.type)
    };

    plugins.verifyRelease(_.assign({
      commits    : results.commits,
      lastRelease: results.lastRelease,
      nextRelease: nextRelease
    }, config), function(err) {
      if (err) {
        return cb(err);
      }
      cb(null, nextRelease);
    })
  });
};
