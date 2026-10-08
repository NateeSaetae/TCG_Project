/** Ordered print finish: micro-etching, diffraction, then white reflected light. */
export function CardFoil() {
  return (
    <div className="sr-finish" aria-hidden="true">
      <div className="sr-etching" />
      <div className="sr-rainbow" />
      <div className="sr-specular" />
    </div>
  );
}
