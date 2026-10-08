/** Call `fn` once calls stop for `delayMs`. */
export function debounce(fn, delayMs) {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}
