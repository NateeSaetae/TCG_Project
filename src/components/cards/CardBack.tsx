import { cardBackImage } from '../../config/cardBack';
import { useCardPointer } from '../../hooks/useCardPointer';
import './card-back.css';

function CardBackArtwork() {
  return (
    <div className="fe-card-back-surface">
      <img
        className="fe-card-back-image"
        src={cardBackImage}
        alt="Fire Emblem Awakening card back"
        draggable={false}
      />
    </div>
  );
}

function InteractiveCardBack() {
  const pointer = useCardPointer();
  return (
    <div {...pointer} className="fe-card-back fe-card-back-interactive">
      <CardBackArtwork />
    </div>
  );
}

/** Embedded backs use the existing physical card's tilt and flip. */
export function CardBack({ interactive = true }: { interactive?: boolean }) {
  return interactive ? (
    <InteractiveCardBack />
  ) : (
    <div className="fe-card-back">
      <CardBackArtwork />
    </div>
  );
}
