import { useEffect, useRef, type PointerEvent } from 'react';
import { holographicProfile } from '../config/cardEffects';

export interface PointerPosition {
  x: number;
  y: number;
}
const rest = { x: 0, y: 0, active: 0 };

/** Writes visual properties at most once per frame; never renders React on move. */
export function useCardPointer(preview?: PointerPosition | null) {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ ...rest });
  const current = useRef({ ...rest });
  const frame = useRef(0);
  const reduced = useRef(false);

  function paint() {
    const element = ref.current;
    if (!element) return;
    const value = current.current;
    const next = target.current;
    let distance = 0;
    for (const key of ['x', 'y', 'active'] as const) {
      value[key] += (next[key] - value[key]) * 0.14;
      distance += Math.abs(next[key] - value[key]);
    }
    if (distance < 0.002) Object.assign(value, next);
    const light = Math.min(1, Math.hypot(value.x, value.y) * 0.65);
    const properties: Record<string, string> = {
      '--px': String(value.x),
      '--py': String(value.y),
      '--rx': -value.y * holographicProfile.rotateX + 'deg',
      '--ry': value.x * holographicProfile.rotateY + 'deg',
      '--mx': (value.x + 1) * 50 + '%',
      '--my': (value.y + 1) * 50 + '%',
      '--foil-x': 50 + value.x * 35 + '%',
      '--foil-y': 50 + value.y * 35 + '%',
      '--foil-angle': 118 + value.x * 18 - value.y * 12 + 'deg',
      '--foil-strength': String(0.12 + value.active * 0.12 + light * 0.2),
      '--specular-strength': String(0.1 + value.active * 0.15 + light * 0.12),
      '--edge-angle': 125 + value.x * 65 + value.y * 35 + 'deg',
      '--presence': String(value.active),
    };
    for (const [key, depth] of Object.entries(holographicProfile.depth)) {
      properties['--' + key + '-x'] = value.x * depth + 'px';
      properties['--' + key + '-y'] = value.y * depth + 'px';
    }
    for (const [key, value] of Object.entries(properties))
      element.style.setProperty(key, value);
    frame.current = distance >= 0.002 ? requestAnimationFrame(paint) : 0;
  }
  function move(x: number, y: number, active = 1) {
    target.current = reduced.current
      ? { ...rest }
      : {
          x: Math.max(-1, Math.min(1, x)),
          y: Math.max(-1, Math.min(1, y)),
          active,
        };
    if (!frame.current) frame.current = requestAnimationFrame(paint);
  }
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reduced.current = query.matches;
      if (query.matches) {
        current.current = { ...rest };
        move(0, 0, 0);
      }
    };
    update();
    query.addEventListener('change', update);
    return () => {
      query.removeEventListener('change', update);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, []);
  useEffect(() => {
    move(preview?.x ?? 0, preview?.y ?? 0, preview ? 1 : 0);
  }, [preview?.x, preview?.y]);

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch' || preview) return;
    // Measure the stationary wrapper, not the rotating face: avoids edge jitter.
    const bounds = event.currentTarget.getBoundingClientRect();
    move(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
    );
  }
  return {
    ref,
    onPointerMove,
    onPointerLeave: () => {
      if (!preview) move(0, 0, 0);
    },
    onPointerCancel: () => move(0, 0, 0),
  };
}
