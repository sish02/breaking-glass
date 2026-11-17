// Arcade effects (Web Animations API). Purely visual: state and feedback text are already final
// before any of this runs (constitution IV — animation never delays feedback or controls).
// With prefers-reduced-motion, every function settles to the final frame immediately.

export const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

const finish = (els) => els.forEach((el) => el && el.remove());

/** FIRE OTDR: pulse out along the strand, trace revealed in step, flash at the break, echo back. */
export function playPulse(svg) {
  if (!svg) return Promise.resolve();
  const cover = svg.querySelector('[data-anim="cover"]');
  const pulse = svg.querySelector('[data-anim="pulse"]');
  const echo = svg.querySelector('[data-anim="echo"]');
  if (!cover) return Promise.resolve();
  if (reducedMotion() || !cover.animate) { finish([cover, pulse, echo]); return Promise.resolve(); }
  const left = Number(svg.dataset.left);
  const right = Number(svg.dataset.right);
  const bx = Number(svg.dataset.breakX);
  const dx = bx - left;
  const out = 1300 + Math.min(900, dx * 1.2);
  const back = 700;
  const opts = { duration: out + back, easing: 'linear', fill: 'forwards' };
  const coverAnim = cover.animate([
    { transform: 'translateX(0px)', offset: 0 },
    { transform: `translateX(${dx}px)`, offset: out / (out + back) },
    { transform: `translateX(${right - left + 4}px)`, offset: 1 },
  ], opts);
  pulse.animate([{ transform: 'translateX(0px)' }, { transform: `translateX(${dx}px)` }], { duration: out, easing: 'linear', fill: 'forwards' });
  pulse.animate([{ r: 7, opacity: 1 }, { r: 18, opacity: 0 }], { delay: out, duration: 350, fill: 'forwards' });
  echo.animate([{ transform: 'translateX(0px)', opacity: 1 }, { transform: `translateX(${-dx}px)`, opacity: 0.9 }],
    { delay: out, duration: back, easing: 'ease-in', fill: 'forwards' });
  return coverAnim.finished.then(() => finish([cover, pulse, echo])).catch(() => {});
}

/** Truck drives to the dig spot, digs, then the hit or miss effect plays. */
export function playDig(svg, { fromX, toX, hit }) {
  if (!svg) return Promise.resolve();
  const truck = svg.querySelector('[data-truck]');
  const result = svg.querySelector('[data-anim="result"]');
  const burst = svg.querySelector('[data-anim="burst"]');
  const miss = svg.querySelector('[data-anim="miss"]');
  const reveal = () => { if (result) result.classList.remove('pending'); };
  if (reducedMotion() || !truck || !truck.animate) { reveal(); return Promise.resolve(); }
  if (miss) miss.style.opacity = '0';
  const drive = Math.min(1300, 350 + Math.abs(toX - fromX) * 1.3);
  const moving = truck.animate([{ transform: `translateX(${fromX}px)` }, { transform: `translateX(${toX}px)` }],
    { duration: drive, easing: 'ease-in-out', fill: 'forwards' });
  return moving.finished.then(() => {
    const dig = truck.animate([
      { transform: `translateX(${toX}px) translateY(0px)` },
      { transform: `translateX(${toX - 2}px) translateY(2px)` },
      { transform: `translateX(${toX + 2}px) translateY(0px)` },
      { transform: `translateX(${toX}px) translateY(2px)` },
      { transform: `translateX(${toX}px) translateY(0px)` },
    ], { duration: 420, iterations: 1 });
    return dig.finished;
  }).then(() => {
    if (hit) {
      reveal();
      if (result) result.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, fill: 'forwards' });
      if (burst) burst.animate([{ transform: 'scale(0.3)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 700, iterations: 2 });
    } else if (miss) {
      miss.animate([{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 280, fill: 'forwards' });
    }
  }).catch(() => { reveal(); });
}

/** Big arcade banner over the scene ("CUT FOUND!" / "NO DAMAGE HERE"). */
export function flashBanner(el) {
  if (!el) return;
  if (reducedMotion() || !el.animate) { el.remove(); return; }
  el.animate([
    { opacity: 0, transform: 'translate(-50%, -50%) scale(0.6)' },
    { opacity: 1, transform: 'translate(-50%, -50%) scale(1.08)', offset: 0.25 },
    { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.75 },
    { opacity: 0, transform: 'translate(-50%, -50%) scale(1)' },
  ], { duration: 1500, delay: 700, fill: 'forwards' }).finished.then(() => el.remove()).catch(() => {});
}
