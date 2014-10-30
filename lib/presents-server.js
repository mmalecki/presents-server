var path = require('path'),
    ws = require('ws'),
    union = require('union'),
    director = require('director'),
    ecstatic = require('ecstatic'),
    basicAuthParser = require('basic-auth-parser');

var PresentsServer = exports.PresentsServer = function (options) {
  var self = this;

  self.connections = [];

  self.router = new director.http.Router();
  self.router.configure({
    async: true
  });

  self.config = require(path.join(process.cwd(), 'config.json'));
  self.server = union.createServer({
    before: [
      function (req, res) {
        console.log(new Date(), req.method, req.url);
        res.emit('next');
      },
      ecstatic('.'),
      ecstatic(path.join(__dirname, '..', 'public')),
      function (req, res) {
        var found = self.router.dispatch(req, res, function onError(err) {
          this.res.json(err.status || 500, err.body || new Error('Unhandled error'));
        });

        if (!found) {
          res.emit('next');
        }
      }
    ]
  });

  self.ws = new ws.Server({ server: self.server });
  self.ws.on('connection', function (connection) {
    self.connections.push(connection);
  });

  if (self.config.password) {
    self.router.before(function () {
      var next = arguments[arguments.length - 1];

      function notAuthorized() {
        return next(new director.http.NotAuthorized('Not authorized'));
      }

      var auth = this.req.headers.authorization;
      if (!auth) {
        return notAuthorized();
      }

      auth = basicAuthParser(auth);

      if (auth.username !== 'presenter' && auth.password !== self.config.password) {
        return notAuthorized();
      }

      next();
    });
  }

  self.router.path('/api', function () {
    this.post('/goTo', function () {
      var slide = this.req.query.slide;

      if (!self.connections.length) {
        return this.res.json(500, { error: 'No client connected' });
      }

      if (!slide) {
        return this.res.json(400, { error: 'Slide query parameter required' });
      }

      self._send({ goTo: slide });
      this.res.writeHead(200);
      this.res.end();
    });

    this.post('/next', function () {
      if (!self.connections.length) {
        return this.res.json(500, { error: 'No client connected' });
      }

      self._send({ next: true });
      this.res.writeHead(200);
      this.res.end();
    });

    this.post('/previous', function () {
      if (!self.connections.length) {
        return this.res.json(500, { error: 'No client connected' });
      }

      self._send({ previous: true });
      this.res.writeHead(200);
      this.res.end();
    });
  });
};

PresentsServer.prototype.listen = function () {
  this.server.listen.apply(this.server, arguments);
};

PresentsServer.prototype.close = function () {
  this.server.close.apply(this.server, arguments);
};

PresentsServer.prototype._send = function (data, callback) {
  var l = this.connections.length;
  this.connections.forEach(function (connection) {
    connection.send(JSON.stringify(data), function (err) {
      //
      // Ignore errors while sending to all clients.
      //
      if (--l === 0 && callback) {
        callback();
      }
    });
  });
};

exports.createServer = function (options) {
  return new PresentsServer(options);
};
