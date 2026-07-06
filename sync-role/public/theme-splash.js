(function () {
  function removeSplash() {
    var splash = document.getElementById('app-splash');
    if (splash && splash.parentNode) {
      splash.classList.add('app-splash--fading');
      setTimeout(function () {
        if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
      }, 400);
    }
  }

  if (document.body && document.getElementById('app-splash')) {
    removeSplash();
  } else {
    document.addEventListener('DOMContentLoaded', removeSplash);
  }
})();
