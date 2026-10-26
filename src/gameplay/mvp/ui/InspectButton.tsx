export function InspectButton({
  label,
  onInspect,
}: {
  label: string;
  onInspect: () => void;
}) {
  return (
    <button
      type="button"
      className="mvp-inspect-button"
      aria-label={`Inspect ${label}`}
      title={`Inspect ${label}`}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onInspect();
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 6 6M10 7v6M7 10h6" />
      </svg>
    </button>
  );
}
