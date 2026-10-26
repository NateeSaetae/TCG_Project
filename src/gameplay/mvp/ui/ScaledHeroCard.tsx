import { useEffect, useRef, useState } from 'react';
import { CardRenderer } from '../../../components/cards/CardRenderer';
import type { HeroCardData } from '../../../types/heroCard';

// Both approved card layouts have a 290px design width and a 0.686 ratio.
const PRINT_WIDTH = 290;

/** Resize the complete print, including its fixed-size details, as one image. */
export function ScaledHeroCard({
  card,
  initialWidth = PRINT_WIDTH,
}: {
  card: HeroCardData;
  initialWidth?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(initialWidth);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      // Layout width stays stable while the board's deploy animation transforms
      // an ancestor. BoundingClientRect would capture that temporary scale.
      const nextWidth = container.clientWidth;
      if (nextWidth > 0) setWidth(nextWidth);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="mvp-scaled-card">
      <div
        className="mvp-scaled-card-print"
        style={{ transform: `scale(${width / PRINT_WIDTH})` }}
      >
        <CardRenderer card={card} managedPointer />
      </div>
    </div>
  );
}
