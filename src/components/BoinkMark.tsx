type BoinkMarkProps = {
  className?: string;
  /** Increment to replay the hammer strike animation. 0 = static. */
  bonk?: number;
  /** Impact lines. Turn off at very small sizes (<= 20px). */
  impact?: boolean;
};

/**
 * boink mark: a squeaky toy hammer bonking a down arrow, which squashes on impact.
 * Geometry lives on a 64x64 grid; kept chunky so it still reads at 16px.
 * The static source files live in /brand.
 */
export function BoinkMark({ className = "", bonk = 0, impact = true }: BoinkMarkProps) {
  return (
    <svg
      key={bonk}
      viewBox="0 0 64 64"
      className={`mark${bonk ? " is-bonking" : ""} ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <g className="mark-arrow">
        <path
          d="M24 37H40V45H51L32 59L13 45H24Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </g>
      <g className="mark-hammer">
        <g transform="rotate(-8 32 33)">
          <rect x="40" y="15.5" width="20" height="7" rx="3.5" fill="currentColor" />
          <rect x="23" y="9" width="18" height="20" rx="3" fill="var(--accent)" />
          <rect x="20" y="5" width="24" height="7" rx="3.5" fill="currentColor" />
          <rect x="20" y="26" width="24" height="7" rx="3.5" fill="currentColor" />
        </g>
      </g>
      {impact && (
        <g className="mark-impact">
          <path
            d="M14 37L8 35M15 31L10 27M50 38L56 36"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}
