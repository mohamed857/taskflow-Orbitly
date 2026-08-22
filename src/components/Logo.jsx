// The Orbitly brand mark: a core "planet" with an elliptical orbit and a
// satellite. Uses currentColor, so wrap it in a text-color class (e.g.
// text-accent) to tint it. Pass `animated` to cycle the brand colors and
// send the satellite around its orbit.
export default function Logo({ size = 28, className = '', animated = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={`${className} ${animated ? 'logo-animated' : ''}`.trim()}
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
      {/* satellite — orbits the core when animated */}
      <g>
        {animated && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 16 16"
            to="360 16 16"
            dur="6s"
            repeatCount="indefinite"
          />
        )}
        <circle cx="26.5" cy="8.5" r="2.4" fill="currentColor" />
      </g>
    </svg>
  )
}
