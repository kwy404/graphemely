// Theme toggle and copy buttons. No dependencies.
(function () {
  var root = document.documentElement;
  var KEY = 'graphemely-theme';

  function stored() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  function current() {
    var forced = root.getAttribute('data-theme');
    if (forced) return forced;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  var saved = stored();
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);

  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      var sync = function () {
        toggle.setAttribute('aria-label', current() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      };
      sync();
      toggle.addEventListener('click', function () {
        var next = current() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try {
          localStorage.setItem(KEY, next);
        } catch (e) {
          /* storage unavailable, the choice lasts for this page only */
        }
        sync();
      });
    }

    var blocks = document.querySelectorAll('pre[data-copy]');
    Array.prototype.forEach.call(blocks, function (pre) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy';
      button.textContent = 'Copy';
      button.addEventListener('click', function () {
        var text = pre.querySelector('code').innerText;
        var done = function () {
          button.textContent = 'Copied';
          setTimeout(function () {
            button.textContent = 'Copy';
          }, 1500);
        };
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(done, function () {
            button.textContent = 'Press Ctrl+C';
          });
        }
      });
      pre.appendChild(button);
    });
  });
})();
