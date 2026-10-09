import { HeroCardLayout } from './HeroCardLayout';
import { resolveRarityDesign } from '../../config/rarityDesigns';
import type { HeroCardData } from '../../types/heroCard';
import { TwoSidedCard, type CardFace } from './TwoSidedCard';
import type { PointerPosition } from '../../hooks/useCardPointer';
import type { CSSProperties, PointerEvent } from 'react';
import type { CardData } from '../../types';
import { SecretRareCard } from './SecretRareCard';
import { isShowcaseCard } from '../../config/cardEffects';
import { rank, rarityColors } from '../../config/rarity';
export function CardRenderer({
  card,
  small = false,
  hidden = false,
  face,
  preview,
  effectsActive = true,
  managedPointer = false,
}: {
  card: CardData | HeroCardData;
  small?: boolean;
  hidden?: boolean;
  face?: CardFace;
  preview?: PointerPosition | null;
  effectsActive?: boolean;
  managedPointer?: boolean;
}) {
  if (face)
    return (
      <TwoSidedCard
        face={face}
        small={small}
        preview={preview}
        effectsActive={effectsActive}
      >
        <CardRenderer
          card={card}
          small={small}
          hidden={hidden}
          managedPointer
          effectsActive={effectsActive}
        />
      </TwoSidedCard>
    );
  if ('layout' in card) {
    return (
      <HeroCardLayout
        card={card}
        design={resolveRarityDesign(card.rarity).design}
        effectsActive={effectsActive}
        small={small}
        hidden={hidden}
        managedPointer={managedPointer}
        preview={preview}
      />
    );
  }
  if (!hidden && isShowcaseCard(card)) {
    return (
      <SecretRareCard
        card={card}
        small={small}
        managedPointer={managedPointer}
      />
    );
  }

  function tilt(e: PointerEvent<HTMLDivElement>) {
    if (managedPointer || e.pointerType === 'touch') return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    const y = (e.clientY - box.top) / box.height;
    e.currentTarget.style.setProperty('--rx', (0.5 - y) * 12 + 'deg');
    e.currentTarget.style.setProperty('--ry', (x - 0.5) * 16 + 'deg');
    e.currentTarget.style.setProperty('--mx', x * 100 + '%');
    e.currentTarget.style.setProperty('--my', y * 100 + '%');
  }
  return (
    <div
      className={[
        'tcg-card',
        small ? 'small' : '',
        hidden ? 'unowned' : '',
        rank(card.rarity) >= 3 ? 'foil' : '',
        rank(card.rarity) === 5 ? 'secret' : '',
      ].join(' ')}
      style={{ '--rarity': rarityColors[card.rarity] } as CSSProperties}
      onPointerMove={tilt}
      onPointerLeave={(e) => {
        if (managedPointer) return;
        e.currentTarget.style.setProperty('--rx', '0deg');
        e.currentTarget.style.setProperty('--ry', '0deg');
      }}
    >
      <img
        className="card-art"
        src={card.image}
        alt={hidden ? 'Uncollected card' : card.character}
        loading="lazy"
      />
      <div className="card-shade" />
      <div className="card-top">
        <span>{hidden ? '?' : card.cost}</span>
        <span>{card.element} ✧</span>
      </div>
      <div className="card-copy">
        <div className="card-rarity">
          {card.rarity} · {card.cardType}
        </div>
        <h3>{hidden ? 'Undiscovered' : card.name}</h3>
        <p>{hidden ? 'An untold story awaits.' : card.description}</p>
        <div className="card-stats">
          <span>⚔ {hidden ? '—' : card.attack}</span>
          <span>◇ {hidden ? '—' : card.defense}</span>
        </div>
        <footer>
          <span>AWAKENING · EN</span>
          <span>{String(card.cardNumber).padStart(3, '0')} / 030</span>
        </footer>
      </div>
      <div className="card-gloss" />
      {rank(card.rarity) >= 3 && <div className="card-foil" />}
    </div>
  );
}
