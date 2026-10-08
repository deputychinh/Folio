/** Show a spinner on a button while `task` runs, and prevent double submits. */
export async function withLoading(button, task) {
  if (!button) return task();
  button.classList.add('button--loading');
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  try {
    return await task();
  } finally {
    button.classList.remove('button--loading');
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
}
