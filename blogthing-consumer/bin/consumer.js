#!/usr/bin/env node
/*jshint node:true laxcomma:true*/
(function () {
  "use strict";

  var port = process.argv[2] || 7788
    , app = require('../server')
    ;

  function run() {
    var server
      ;

    function onListening() {
      var addr = server.address()
        ;

      console.log("Consumer listening on http://%s:%d", addr.address, addr.port);
    }

    server = app.listen(port, onListening);
  }

  if (require.main === module) {
    run();
  }
}());
