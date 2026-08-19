// The Orbitly brand mark: a core "planet" with an elliptical orbit and a
// satellite. Uses currentColor, so wrap it in a text-color class (e.g.
// text-accent) to tint it.
export default function Logo({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* orbit ring */}
      <ellipse
        cx="16"
        cy="16"
        rx="13"
        ry="6.5"
        transform="rotate(-28 16 16)"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.55"
      />
      {/* core */}
      <circle cx="16" cy="16" r="5.5" fill="currentColor" />
      {/* satellite */}
      <circle cx="26.5" cy="8.5" r="2.4" fill="currentColor" />
    </svg>
  )
}
