/**
 * Framework-agnostic scroll lock. Returns the release function.
 * Nested calls are reference-counted, so a dialog opened over a sider does not
 * unlock the page when only the inner one closes.
 */
let depth = 0
let previousOverflow = ''

export function lockScroll(): () => void {
  if (depth === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  depth += 1
  let released = false
  return () => {
    if (released) return
    released = true
    depth -= 1
    if (depth === 0) document.body.style.overflow = previousOverflow
  }
}
