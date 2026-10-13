import { SecretHeroCard } from './SecretHeroCard';
import { HeroCardLayout } from './HeroCardLayout';
import { resolveRarityDesign } from '../../config/rarityDesigns';
import type { HeroCardData } from '../../types/heroCard';
import { TwoSidedCard, type CardFace } from './TwoSidedCard';
import type { PointerPosition } from '../../hooks/useCardPointer';
import type { WeaponType } from '../../types/combat';

export function CardRenderer({
  card,
  small = false,
  hidden = false,
  face,
  preview,
  effectsActive = true,
  managedPointer = false,
  activeWeapon,
}: {
  card: HeroCardData;
  small?: boolean;
  hidden?: boolean;
  face?: CardFace;
  preview?: PointerPosition | null;
  effectsActive?: boolean;
  managedPointer?: boolean;
  activeWeapon?: WeaponType;
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
          activeWeapon={activeWeapon}
        />
      </TwoSidedCard>
    );

  const variant = resolveRarityDesign(card.rarity);
  if (variant.layout === 'secret-full-art')
    return (
      <SecretHeroCard
        card={card}
        small={small}
        hidden={hidden}
        managedPointer={managedPointer}
        preview={preview}
        effectsActive={effectsActive}
        activeWeapon={activeWeapon}
      />
    );

  return (
    <HeroCardLayout
      card={card}
      design={variant.design}
      effectsActive={effectsActive}
      small={small}
      hidden={hidden}
      managedPointer={managedPointer}
      preview={preview}
      activeWeapon={activeWeapon}
    />
  );
}
