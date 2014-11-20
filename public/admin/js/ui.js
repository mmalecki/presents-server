(function (exports) {
  var password = '',
      timerInterval,
      timerSeconds = 0;

  function submitPassword() {
    password = document.getElementById('password').value;
    document.getElementById('passwordForm').style.display = 'none';
    return false;
  }

  function timerToggle() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    else {
      timerInterval = setInterval(timerTick, 1000);
    }
  }

  function timerTick() {
    function pad(number) {
      number = number.toString();
      if (number.length === 1) {
        number = '0' + number;
      }
      return number;
    }

    ++timerSeconds;

    document.getElementById('timer').innerHTML =
      pad(Math.floor(timerSeconds / 60)) + ':' + pad(timerSeconds);
  }

  exports.timerToggle = timerToggle;
})(window.ui = {});
