import type { CSSProperties } from 'react';
import type { MagicEffectProfile } from '../../types/magicEffects';
import './magic-effects.css';

export function magicEffectVariables(
  profile: MagicEffectProfile,
): CSSProperties {
  return {
    '--ur-front-effect-opacity': profile.foregroundOpacity,
    '--ur-front-effect-depth': profile.foregroundDepth,
    '--magic-background-depth': profile.backgroundDepth,
    '--magic-foil-intensity': profile.foilIntensity,
    '--magic-highlight-opacity': profile.highlightOpacity,
    '--magic-cyan': profile.colors[0],
    '--magic-ice': profile.colors[1],
    '--magic-lavender': profile.colors[2],
    '--magic-pink': profile.colors[3],
    '--magic-champagne': profile.colors[4],
  } as CSSProperties;
}

/** Shares the existing smoothed CSS pointer values; never installs input handlers. */
export function MagicEffects({
  active,
  profile,
}: {
  active: boolean;
  profile: MagicEffectProfile;
}) {
  if (!active || !profile.enabled) return null;
  return (
    <>
      <div className="ur-magic-aura" aria-hidden="true">
        {profile.backgroundArtwork && (
          <img src={profile.backgroundArtwork} alt="" draggable={false} />
        )}
      </div>
      <div
        className="ur-magic-reflection"
        aria-hidden="true"
        style={{
          maskImage: 'url("' + profile.foilArtwork + '")',
          WebkitMaskImage: 'url("' + profile.foilArtwork + '")',
        }}
      >
        <div
          className="ur-magic-selective"
          style={{
            maskImage: 'url("' + profile.foilMask + '")',
            WebkitMaskImage: 'url("' + profile.foilMask + '")',
          }}
        >
          <div className="ur-magic-spectrum" />
          <div className="ur-magic-specular" />
        </div>
      </div>
    </>
  );
}
