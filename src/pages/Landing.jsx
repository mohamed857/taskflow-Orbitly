import { useEffect, useRef } from 'react'
import landingHtml from './LandingContent.html?raw'

// Public marketing home. The approved editorial design lives as a single,
// self-contained HTML document (LandingContent.html) so it renders exactly as
// designed. We host it in a full-viewport iframe: this isolates its warm,
// hand-crafted styling from the app's Tailwind theme with zero collision, and
// keeps the design file as the single source of truth. The in-page CTAs use
// target="_top", so "ابدأ مجاناً" / "تسجيل الدخول" navigate the whole app to
// /register-company and /login.
export default function Landing() {
  const frameRef = useRef(null)

  // Reflect the landing's own <title> while it's the active view, then restore.
  useEffect(() => {
    const prev = document.title
    document.title = 'Orbitly — نظّم شغل فريقك في مكان واحد'
    return () => {
      document.title = prev
    }
  }, [])

  return (
    <iframe
      ref={frameRef}
      title="Orbitly"
      srcDoc={landingHtml}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        border: 0,
        display: 'block',
      }}
    />
  )
}
