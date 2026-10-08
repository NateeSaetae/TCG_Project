import type { CSSProperties } from 'react';
import { brand } from '../../config/brand';
export function BoosterPack({ tearing = false }: { tearing?: boolean }) {
  return (
    <div className={'booster ' + (tearing ? 'tearing' : '')}>
      <div className="pack-crimp top" />
      <div
        className="pack-design"
        style={
          {
            '--booster-art': 'url("' + brand.assets.boosterArt + '")',
          } as CSSProperties
        }
      >
        <span className="pack-label">THE HERO COLLECTION</span>
        <strong>
          FIRE EMBLEM<small>TCG</small>
        </strong>
        <img className="pack-crest" src={brand.assets.crest} alt="" />
        <div className="pack-bottom">
          <span>ROYAL SUMMONS</span>
          <b>CHAPTER I</b>
          <small>5 CARDS · PROTOTYPE EDITION</small>
        </div>
      </div>
      <div className="pack-crimp bottom" />
    </div>
  );
}
