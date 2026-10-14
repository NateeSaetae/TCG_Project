import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import type {
  CharacterGameplayData,
  StatKey,
  WeaponType,
} from '../../types/combat';
import './hero-combat-details.css';

const statOrder: StatKey[] = ['HP', 'ATK', 'DEF', 'MAG', 'RES', 'SPD'];
const weaponImages: Record<WeaponType, string> = {
  Sword: '/art/aether/icons/weapons/sword.svg',
  Lance: '/art/aether/icons/weapons/lance.svg',
  Axe: '/art/aether/icons/weapons/axe.svg',
  Bow: '/art/aether/icons/weapons/bow.svg',
  Magic: '/art/aether/icons/weapons/magic.svg',
  Staff: '/art/aether/icons/weapons/staff.svg',
  Dagger: '/art/aether/icons/weapons/dagger.svg',
};

function WeaponGlyph({ weapon }: { weapon: WeaponType }) {
  return <img src={weaponImages[weapon]} alt="" draggable={false} />;
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
