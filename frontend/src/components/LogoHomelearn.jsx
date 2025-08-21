// frontend/src/components/LogoHomelearn.jsx
import { mdiCat } from '@mdi/js';

export default function LogoHomelearn({ className = "h-9 w-9", style = {} }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Homelearn logo"
      className={className}
      style={style}
    >
      {/* Birrete */}
      <polygon points="28 8, 46 15, 28 22, 10 15" fill="currentColor" />
      <rect x="22" y="22" width="12" height="3" rx="1.5" fill="currentColor" />
      <path d="M44 15 L44 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="44" cy="25.5" r="1.7" fill="currentColor" />

      {/* Casa */}
      <path d="M6 28 L28 12 L46 28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <rect x="12" y="28" width="28" height="24" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="23" y="38" width="8" height="14" rx="1.5" stroke="currentColor" strokeWidth="2" fill="none" />

      {/* Gato sólido (MDI) */}
      {/* El icono MDI está dibujado para un viewBox 24x24. Lo escalamos y ubicamos a la derecha. */}
      <g transform="translate(40, 24)">
        <g transform="scale(1.0)">
          <path d={mdiCat} fill="currentColor" />
        </g>
      </g>
    </svg>
  );
}
