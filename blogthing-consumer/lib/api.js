(function () {
  "use strict";

  var connect = require('connect')
    , path = require('path')
    , fooStrategy = require('./foo-oauth2-strategy')
    , auth = require('connect-auth')
    , authOptions
    , fooStrategyOptions
    , app
    ;

  // GET http://localhost:7788/login
  function fooAuth(req, res, next) {
    // This is the name of the global function stored on the window object
    // that will be called to close the child window and pass back any objects
    req.session.oauthCallback = req.session.oauthCallback || req.query.oauthCallback;
    console.log('[fooAuth] oauthCallback=', req.session.oauthCallback);
    req.session.save(function () {
      console.log('[fooAuth] saved session');
      console.log('[fooAuth] oauthCallback=', req.session.oauthCallback);
    });

    function logAuthentication(error, authenticated) {
      if (error) {
        // Something has gone awry, behave as you wish.
        console.error(error);
        res.end();
        return;
      }

      if (undefined === authenticated) {
        // The authentication strategy requires some more browser interaction, suggest you do nothing here!
        console.log('[fooAuth] Waiting for browser interaction...');
        console.log('[fooAuth] Auth status:', req.isAuthenticated());
        console.log('[fooAuth] oauthCallback=', req.session.oauthCallback);
        return;
      }

      // We've either failed to authenticate, or succeeded
      // (req.isAuthenticated() will confirm, as will the value of the received argument)
      console.log('[fooAuth] Already attempted authentication before');
      console.log('[fooAuth] Auth status:', req.isAuthenticated());
      console.log('[fooAuth] oauthCallback=', req.session.oauthCallback);
      oauthCallbackRoute(req, res, next);
      //next();
    }

    req.authenticate(['foo'], { scope: ["email", "birthday"] }, logAuthentication);
  }

  function logoutRoute(req, res) {
    console.log('looking at /logout');
    req.logout(); // Using the 'event' model to do a redirect on logout.
    res.end();
  }

  function statusRoute(req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.write(JSON.stringify(req.getAuthDetails().user));
    res.end();
  }

  function oauthCallbackRoute(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});

    // What the L happens to the session here?
    console.log('[oauthCallback] oauthCallback=', req.session.oauthCallback);
    if (!req.session.oauthCallback) {
      console.error('Lost the session! oauthCallback was defined, but is no longer');
    }

    res.write(
        '<html><head>'
      + '<script>console.log("req.session.oauthCallback:", "' + req.session.oauthCallback + '");'
        + 'window.opener.'
        + req.session.oauthCallback + '('
        + JSON.stringify(req.isAuthenticated())
        + ')</script>'
      + '</head><body>If the session were preserved, you wouldn\'t see this window.</body></html>'
    );
    res.end();
  }

  function secretRoute(req, res) {
    if (req.isAuthenticated()) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.write(JSON.stringify({ secret: "Jess has a crush on Mark" }));
    } else {
      res.statusCode = 404;
      console.log('[fooAuth] Auth status:', req.isAuthenticated());
      res.write("these aren't the droids you're looking for, move along");
    }
    res.end();
  }

  function redirectOnLogout(redirectUrl) {

    function handler(authContext, loggedOutUser, callback) {
      console.log('redirectOnLogout url', redirectUrl);
      authContext.response.writeHead(303, { 'Location': redirectUrl });
      authContext.response.end(
          '<html>'
        + '<body style="background-color: #EEEEFF;">'
        + 'looking at redirectOnLogout'
      );

      if (callback) {
        callback();
      }
    }

    return handler;
  }

  fooStrategyOptions = {
      appId: "1" // 1
    , appSecret: "1secret" // 1secret
    , callback: "http://localhost:7788/auth/fooauth_callback"  // http://yourtesthost.com/auth/github_callback
  };

  authOptions = {
      strategies: [
          fooStrategy(fooStrategyOptions)
      ]
    , trace: true
    , logoutHandler: redirectOnLogout("/")
  };

  app = connect()
    .use(connect.static(path.join(__dirname, 'public')))
    .use(connect.favicon())
    .use(connect.cookieParser("keybored dog"))
    .use(connect.session())
    .use(connect.query())
    .use(connect.json())
    .use(connect.urlencoded())
    .use(auth(authOptions))
    .use("/login", fooAuth)
    .use("/logout", logoutRoute)
    .use("/status", statusRoute)
    .use("/secret", secretRoute)
    .use("/auth/fooauth_callback", oauthCallbackRoute)
  ;

  module.exports = app;
}());
