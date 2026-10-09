/** The printed gold frame stays static; this masked sheen moves with pointer light. */
export function UltraRareFoil({ active }: { active: boolean }) {
  return active ? <div className="ultra-rare-foil" aria-hidden="true" /> : null;
}
