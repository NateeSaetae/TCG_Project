import { useRef, useState, type PointerEvent } from 'react';

export function useRevealDrag(activate: () => void, enabled: boolean) {
  const start = useRef<{
    x: number;
    y: number;
    time: number;
    id: number;
  } | null>(null);
  const suppressClick = useRef(false);
  const [offset, setOffset] = useState(0);
  function end(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    const origin = start.current;
    if (!origin || origin.id !== event.pointerId) return;
    const distance = event.clientX - origin.x;
    const moved = Math.hypot(distance, event.clientY - origin.y) > 8;
    suppressClick.current = moved || cancelled;
    start.current = null;
    setOffset(0);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (
      !cancelled &&
      Math.abs(distance) >= 80 &&
      performance.now() - origin.time >= 100
    )
      activate();
  }
  return {
    className: 'reveal-button draggable-reveal',
    style: {
      transform: `translateX(${offset * 0.35}px) rotate(${offset / 18}deg)`,
      transition: offset ? 'none' : 'transform 240ms ease-out',
    },
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (!enabled || !event.isPrimary || event.button !== 0) return;
      suppressClick.current = false;
      start.current = {
        x: event.clientX,
        y: event.clientY,
        time: performance.now(),
        id: event.pointerId,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: PointerEvent<HTMLButtonElement>) => {
      if (start.current?.id === event.pointerId)
        setOffset(
          Math.max(-160, Math.min(160, event.clientX - start.current.x)),
        );
    },
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => end(event),
    onPointerCancel: (event: PointerEvent<HTMLButtonElement>) =>
      end(event, true),
    onLostPointerCapture: () => {
      start.current = null;
      setOffset(0);
    },
    onClick: () => {
      if (suppressClick.current) {
        suppressClick.current = false;
        return;
      }
      activate();
    },
  };
}
