import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { MvpHandCard } from '../types';
import { isCombatant } from '../state/deck';
import { cardForCombatant, nameOfCombatant } from './gameplayCardData';
import { ScaledHeroCard } from './ScaledHeroCard';

export function CardPreviewOverlay({
  card,
  onClose,
}: {
  card: MvpHandCard | null;
  onClose: () => void;
}) {
  return card && isCombatant(card)
    ? createPortal(
        <CardPreviewContent card={card} onClose={onClose} />,
        document.body,
      )
    : null;
}

export function CardPreviewContent({
  card,
  onClose,
}: {
  card: Extract<MvpHandCard, { currentHp: number }>;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const print = cardForCombatant(card);
  useEffect(() => {
    const dialog = dialogRef.current!;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialogRef}
      className="mvp-card-preview"
      aria-label={`Card preview: ${nameOfCombatant(card)}`}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onKeyDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="mvp-card-preview-content">
        <button
          type="button"
          className="mvp-card-preview-close"
          aria-label="Close card preview"
          onClick={onClose}
          autoFocus
        >
          ×
        </button>
        <div className="mvp-card-preview-print">
          {print ? (
            <ScaledHeroCard card={print} interactive initialWidth={360} />
          ) : (
            <p>{nameOfCombatant(card)}</p>
          )}
        </div>
        <div className="mvp-card-preview-details">
          <strong>
            {nameOfCombatant(card)} · Battle HP {card.currentHp}/10
          </strong>
          <span>
            Equipped: {card.weapon} ·{' '}
            {card.exhausted
              ? 'Exhausted'
              : card.newlyDeployed
                ? 'Newly deployed'
                : 'Ready'}
          </span>
        </div>
      </div>
    </dialog>
  );
}
