import { useId } from 'react';
import './patterned-foil-border.css';

/** Original engraved motifs, clipped to the rim rather than the character/text. */
export function PatternedFoilBorder({ active }: { active: boolean }) {
  const id = 'foil-rim-' + useId().replace(/:/g, '');
  const rim = 'M0 0H100V145.773H0Z M5 5H63L69 11H95V139.5H5Z';
  return (
    <svg
      className="patterned-foil-border"
      data-active={active ? 'on' : 'off'}
      viewBox="0 0 100 145.773"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={id + '-clip'}>
          <path d={rim} clipRule="evenodd" />
        </clipPath>
        <linearGradient id={id + '-silver'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f9ffef" />
          <stop offset=".18" stopColor="#b6dbe5" />
          <stop offset=".36" stopColor="#e4bde5" />
          <stop offset=".49" stopColor="#fffef5" />
          <stop offset=".65" stopColor="#b6c4df" />
          <stop offset=".82" stopColor="#b9eadc" />
          <stop offset="1" stopColor="#f7d6e7" />
        </linearGradient>
        <linearGradient id={id + '-shine'}>
          <stop offset="0" stopColor="white" stopOpacity="0" />
          <stop offset=".44" stopColor="white" stopOpacity="0" />
          <stop offset=".5" stopColor="white" stopOpacity=".95" />
          <stop offset=".56" stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <pattern
          id={id + '-engraving'}
          width="12"
          height="19"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-17)"
        >
          <g
            fill="none"
            stroke="white"
            strokeWidth=".36"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 1V6M.6 2.5L3.5 4M1 5L4 1M6 0L5 4L8 3L7 7M10 1L9 4L11 6M1 10L3 8L4 12L1 14M7 10V15M5 12H9M6 14L9 16M10 9L11 12L10 15" />
            <path d="M0 17L4 16M6 18L9 17M4 7L5 8M11 18H12" strokeWidth=".22" />
          </g>
          <path
            d="M3 8L4 7L5 8L4 9Z M8 5L8.6 6.2L10 6.5L8.6 6.8L8 8L7.4 6.8L6 6.5L7.4 6.2Z"
            fill="white"
            opacity=".8"
          />
        </pattern>
      </defs>
      <g clipPath={'url(#' + id + '-clip)'}>
        <rect
          width="100"
          height="145.773"
          fill={'url(#' + id + '-silver)'}
          className="foil-rim-metal"
        />
        <rect
          width="100"
          height="145.773"
          fill={'url(#' + id + '-engraving)'}
          className="foil-rim-engraving"
        />
        <rect
          x="-70"
          y="-70"
          width="240"
          height="290"
          fill={'url(#' + id + '-shine)'}
          className="foil-rim-glint"
        />
      </g>
      <path
        d="M5 5H63L69 11H95V139.5H5Z"
        fill="none"
        stroke="#f7f2ff"
        strokeWidth=".45"
      />
    </svg>
  );
}
