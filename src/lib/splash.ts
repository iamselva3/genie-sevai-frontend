const MIN_VISIBLE_MS = 1750;
const EXIT_MS = 950;

/** Plays the exit of the static splash in index.html once the app has rendered. */
export function finishSplash() {
  const el = document.getElementById('splash');
  if (!el) return;
  if (document.documentElement.classList.contains('no-splash')) {
    el.remove();
    return;
  }

  let done = false;
  const exit = () => {
    if (done) return;
    done = true;
    // The class goes on the splash itself so only its subtree is restyled.
    el.classList.add('exit');
    window.setTimeout(() => el.remove(), EXIT_MS);
  };

  el.addEventListener('click', exit, { once: true });
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const wait = reduced ? 300 : Math.max(0, MIN_VISIBLE_MS - performance.now());
  window.setTimeout(exit, wait);
}
