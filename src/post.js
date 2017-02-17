'use strict';

const url       = require('url');
const gitHead   = require('git-head');
const GitHubApi = require('github');
const parseSlug = require('parse-github-repo-url');

module.exports = function(config, cb) {
  let pkg      = config.pkg;
  let options  = config.options;
  let plugins  = config.plugins;
  let ghConfig = options.githubUrl ? url.parse(options.githubUrl) : {};
  let github   = new GitHubApi({
    port      : ghConfig.port,
    protocol  : (ghConfig.protocol || '').split(':')[0] || null,
    host      : ghConfig.hostname,
    pathPrefix: options.githubApiPathPrefix || null
  });

  plugins.generateNotes(config, function(err, log) {
    if (err) {
      return cb(err);
    }

    gitHead(function(err, hash) {
      if (err) {
        return cb(err);
      }

      let ghRepo  = parseSlug(pkg.repository.url);
      let release = {
        owner           : ghRepo[0],
        repo            : ghRepo[1],
        name            : 'v' + pkg.version,
        tag_name        : 'v' + pkg.version,
        target_commitish: hash,
        draft           : !!options.debug,
        body            : log,
        prerelease      : !!options.prerelease
      };

      if (options.debug && !options.githubToken) {
        return cb(null, false, release);
      }

      github.authenticate({
        type : 'token',
        token: options.githubToken
      });

      github.repos.createRelease(release, function(err) {
        if (err) {
          return cb(err);
        }

        cb(null, true, release);
      });
    })
  })
};
