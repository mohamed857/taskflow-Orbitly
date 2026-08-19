import { createPortal } from 'react-dom'

// Renders children directly into document.body, completely outside the
// normal React tree. This is the real, permanent fix for a bug we've now
// hit twice: any ancestor with an active CSS transform (a hovered
// .console-panel, an in-flight .animate-enter) creates a new "containing
// block" for `position: fixed` descendants, silently breaking their
// positioning and letting mouse events leak through to whatever is
// underneath. A portal sidesteps the DOM hierarchy entirely, so no
// ancestor's transform can ever affect it, no matter what gets added to
// the page around it later.
export default function Portal({ children }) {
  return createPortal(children, document.body)
}
