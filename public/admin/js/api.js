(function (exports) {
  exports.request = function (options, callback) {
    var req = new XMLHttpRequest();
    req.open(options.method, options.url, true);
    req.setRequestHeader('authorization', 'Basic ' + btoa('presenter:' + password));

    req.onreadystatechange = function (e) {
      if (req.readyState === 4) {
        callback && callback(null, { statusCode: req.status }, req.responseText);
      }
    };

    req.send();
  };

  exports.previous = function () {
    exports.request({
      url: '/api/previous',
      method: 'POST'
    });
  };

  exports.next = function () {
    exports.request({
      url: '/api/next',
      method: 'POST'
    });
  };
})(window.PresentsAPI = {});
