import { useId } from 'react';
import type { HeroCardData } from '../../types/heroCard';
import {
  rarityCode,
  rarityNames,
  type HeroCardDesign,
} from '../../config/rarityDesigns';
import { HeroArtwork } from './HeroArtwork';
import {
  useCardPointer,
  type PointerPosition,
} from '../../hooks/useCardPointer';
import './common-hero-card.css';
import './uncommon-hero-card.css';
import './rare-hero-card.css';
import './super-rare-hero-card.css';
import './ultra-rare-hero-card.css';

/** The printed face only; Card/TwoSidedCard continue to own flipping. */
export function HeroCardLayout({
  card,
  small = false,
  hidden = false,
  managedPointer = false,
  preview,
  design = {},
  effectsActive = true,
}: {
  card: HeroCardData;
  small?: boolean;
  hidden?: boolean;
  managedPointer?: boolean;
  preview?: PointerPosition | null;
  design?: HeroCardDesign;
  effectsActive?: boolean;
}) {
  const pointer = useCardPointer(preview);
  const code = rarityCode(card.rarity);
  const Effects = design.Effects;
  const identityClipId = useId().replace(/:/g, '');
  return (
    <div
      {...(managedPointer ? {} : pointer)}
      className={
        'common-hero-card ' +
        (small ? 'small ' : '') +
        (hidden ? 'hero-undiscovered' : '')
      }
    >
      <div
        className={
          'common-hero-body' +
          (design.background?.className
            ? ' ' + design.background.className
            : '')
        }
        style={design.background?.style}
      >
        <div
          className={
            'common-art-field' +
            (design.artwork?.className ? ' ' + design.artwork.className : '')
          }
          style={design.artwork?.style}
        >
          {!hidden && (
            <HeroArtwork card={card} layered={design.artwork?.layers} />
          )}
          {hidden && (
            <span className="common-unknown" aria-label="Undiscovered hero">
              ?
            </span>
          )}
        </div>
        <div className="common-stat-bar">
          <div
            className="common-cost"
            aria-label={'Cost ' + (hidden ? 'unknown' : card.cost)}
          >
            <span>COST</span>
            <b>{hidden ? '?' : card.cost}</b>
          </div>
          <div className="common-power">
            <span>POWER</span>
            <b>{hidden ? '—' : card.power}</b>
          </div>
        </div>
        <svg
          className="common-description-trim"
          viewBox="0 0 300 14"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M0 14V3H53L63 9H133L143 3H157L167 9H237L247 3H300V14Z"
            fill="#284a77"
          />
          <path
            d="M0 3H53L63 9H133L143 3H157L167 9H237L247 3H300M0 13.5H300"
            fill="none"
            stroke="#c8a86a"
            strokeWidth="1"
          />
        </svg>
        <div
          className={
            'common-description' +
            (design.description?.className
              ? ' ' + design.description.className
              : '')
          }
          style={design.description?.style}
        >
          <p>
            {hidden
              ? 'Summon this hero to discover their story.'
              : card.description}
          </p>
        </div>
        <svg
          className="common-shape-definitions"
          width="0"
          height="0"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <clipPath id={identityClipId} clipPathUnits="objectBoundingBox">
              {/* Curved outer shoulders round the description's lower corners. */}
              <path d="M0 0Q0 .14 .018 .14H.287L.328 0H.672L.713 .14H.982Q1 .14 1 0V1H0Z" />
            </clipPath>
          </defs>
        </svg>
        <div
          className={
            'common-identity' +
            (design.nameplate?.className
              ? ' ' + design.nameplate.className
              : '')
          }
          style={{
            clipPath: 'url(#' + identityClipId + ')',
            ...design.nameplate?.style,
          }}
        >
          <span className="common-category">CHARACTER</span>
          <h3>{hidden ? 'Undiscovered' : card.name}</h3>
          <p>{hidden ? 'Unknown hero' : card.characterType}</p>
        </div>
        <footer className="common-card-footer">
          <span
            className={
              'common-rarity' +
              (design.badge?.className ? ' ' + design.badge.className : '')
            }
            style={design.badge?.style}
            aria-label={rarityNames[code]}
          >
            {code}
            <svg
              className="common-rarity-seal"
              viewBox="0 0 100 100"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M50 3 91 26.5V73.5L50 97 9 73.5V26.5Z"
                fill="#c8a86a"
                stroke="#f0e5cf"
                strokeWidth="2"
              />
              <path
                d="M50 11 84 30.5V69.5L50 89 16 69.5V30.5Z"
                fill="#142541"
                stroke="#8f7548"
                strokeWidth="2"
              />
              <path
                d="M50 18 78 34V66L50 82 22 66V34Z"
                fill="none"
                stroke="#c8a86a"
                strokeWidth="1.2"
              />
              <path
                d="M50 17 54 22 50 27 46 22ZM50 73 54 78 50 83 46 78Z"
                fill="#c8a86a"
              />
              <path
                d="M24 41 28 50 24 59M76 41 72 50 76 59"
                fill="none"
                stroke="#c8a86a"
                strokeWidth="1.8"
              />
            </svg>
          </span>
          <span className="common-card-id">{card.id}</span>
        </footer>
        <svg
          className={
            'common-print-frame' +
            (design.frame?.className ? ' ' + design.frame.className : '')
          }
          style={design.frame?.style}
          viewBox="0 0 100 145.773"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M5 13V5H63L69 11H95V139.5H5Z"
            fill="none"
            stroke="#284a77"
            strokeWidth="1.2"
          />
          <path
            d="M6.1 13V6.2H62.5L68.5 12.2H93.9V138.3H6.1"
            fill="none"
            stroke="#c8a86a"
            strokeWidth=".35"
          />
        </svg>
        {Effects && !hidden && <Effects active={effectsActive} />}
      </div>
    </div>
  );
}
