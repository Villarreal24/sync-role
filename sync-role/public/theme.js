(function () {
  try {
    var raw = localStorage.getItem('sync-role:theme');
    var theme = 'system';
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.state && parsed.state.theme) {
          theme = parsed.state.theme;
        }
      } catch (e) {}
    }
    var resolved = theme;
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  } catch (e) {}

  var splash = document.getElementById('app-splash');
  if (splash) {
    requestAnimationFrame(function () {
      splash.classList.add('app-splash--fading');
      setTimeout(function () {
        if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
      }, 400);
    });
  }
})();
