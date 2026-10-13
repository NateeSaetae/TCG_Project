import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import type {
  CharacterGameplayData,
  StatKey,
  WeaponType,
} from '../../types/combat';
import './hero-combat-details.css';

const statOrder: StatKey[] = ['HP', 'ATK', 'DEF', 'MAG', 'RES', 'SPD'];
const weaponImages: Partial<Record<WeaponType, string>> = {
  Sword: '/art/aether/icons/weapons/sword.svg',
  Lance: '/art/aether/icons/weapons/lance.svg',
  Axe: '/art/aether/icons/weapons/axe.svg',
};

function WeaponGlyph({ weapon }: { weapon: WeaponType }) {
  const image = weaponImages[weapon];
  if (image) return <img src={image} alt="" draggable={false} />;

  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      {weapon === 'Magic' ? (
        <>
          <circle cx="16" cy="16" r="7" />
          <path d="M16 2v7M16 23v7M2 16h7M23 16h7" />
        </>
      ) : weapon === 'Staff' ? (
        <>
          <path d="M16 8v21M11 6l5-4 5 4-5 5-5-5ZM11 18h10" />
        </>
      ) : (
        <path d="m21 3 5 5-12 12-5-5L21 3ZM7 18l7 7M5 27l4-4" />
      )}
    </svg>
  );
}

export function HeroWeaponIcons({
  weapons,
  activeWeapon,
}: {
  weapons: readonly WeaponType[];
  activeWeapon?: WeaponType;
}) {
  return (
    <div
      className="hero-weapon-icons"
      role="group"
      aria-label="Allowed weapons"
    >
      {weapons.map((weapon, index) => (
        <span
          className={
            'hero-weapon-icon' +
            (activeWeapon
              ? weapon === activeWeapon
                ? ' is-featured'
                : ''
              : index === 0
                ? ' is-featured'
                : '')
          }
          data-equipped={activeWeapon === weapon}
          aria-label={weapon + (activeWeapon === weapon ? ' equipped' : '')}
          key={weapon}
        >
          <WeaponGlyph weapon={weapon} />
        </span>
      ))}
    </div>
  );
}

export function HeroStatusPanel({
  gameplay,
}: {
  gameplay: CharacterGameplayData;
}) {
  const [expanded, setExpanded] = useState(false);
  const toggle = (event: MouseEvent | KeyboardEvent) => {
    event.stopPropagation();
    setExpanded((value) => !value);
  };
  return (
    <div
      className={'hero-status-panel' + (expanded ? ' expanded' : '')}
      role="button"
      tabIndex={0}
      aria-label={
        expanded ? 'Collapse character stats' : 'Expand character stats'
      }
      aria-expanded={expanded}
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle(event);
        }
      }}
    >
      <span className="hero-status-tab" aria-hidden="true">
        <span className="hero-status-tab-bars">
          <i />
          <i />
          <i />
        </span>
        <span className="hero-status-tab-chevron" />
      </span>
      {expanded && (
        <div className="hero-status-rows">
          {statOrder.map((stat) => (
            <div className="hero-status-row" key={stat}>
              <span className="hero-status-label">{stat}</span>
              <span className="hero-status-value">
                {gameplay.baseStats[stat] ?? '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
