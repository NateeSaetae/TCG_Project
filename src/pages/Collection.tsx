import { rarityLabels } from '../config/rarityLabels';
import { useState } from 'react';
import { archiveCards } from '../data/catalog';
import type { HeroCardData } from '../types/heroCard';
import { rarities, rank, rarityName } from '../config/rarity';
import { CardRenderer } from '../components/cards/CardRenderer';
export function Collection({
  owned,
  view,
}: {
  owned: Record<string, number>;
  view: (c: HeroCardData) => void;
}) {
  const [search, setSearch] = useState('');
  const [rarity, setRarity] = useState('');
  const [sort, setSort] = useState('number');
  const [only, setOnly] = useState(false);
  const filtered = archiveCards
    .filter(
      (c) =>
        (!only || owned[c.id]) &&
        c.name.toLowerCase().includes(search.toLowerCase()) &&
        (!rarity || rarityName(c.rarity) === rarity),
    )
    .sort((a, b) =>
      sort === 'rarity'
        ? rank(b.rarity) - rank(a.rarity) ||
          archiveCards.indexOf(a) - archiveCards.indexOf(b)
        : archiveCards.indexOf(a) - archiveCards.indexOf(b),
    );
  return (
    <section className="collection-page">
      <div className="eyebrow">THE HERO COLLECTION · YOUR LEGACY</div>
      <div className="section-heading">
        <div>
          <h1>Hero Archive</h1>
          <p>A record of every hero called to your side.</p>
        </div>
        <div className="count">
          <b>{Object.keys(owned).length}</b> / {archiveCards.length}{' '}
          <span>HEROES DISCOVERED</span>
        </div>
      </div>
      <div
        className="archive-progress"
        role="progressbar"
        aria-label="Hero archive completion"
        aria-valuemin={0}
        aria-valuemax={archiveCards.length}
        aria-valuenow={Object.keys(owned).length}
      >
        <span
          style={{
            width:
              (Object.keys(owned).length / archiveCards.length) * 100 + '%',
          }}
        />
      </div>
      <div className="filters">
        <input
          aria-label="Search cards"
          placeholder="Search the archive…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Rarity"
          value={rarity}
          onChange={(e) => setRarity(e.target.value)}
        >
          <option value="">All rarities</option>
          {rarities.map((r) => (
            <option key={r} value={r}>
              {r} · {rarityLabels[r]}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="number">Card number</option>
          <option value="rarity">Highest rarity</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={only}
            onChange={(e) => setOnly(e.target.checked)}
          />{' '}
          Owned only
        </label>
      </div>
      <p className="result-count">
        {filtered.length} cards ·{' '}
        {Object.values(owned).reduce((a, b) => a + b, 0)} total collected
      </p>
      <div className="collection-grid">
        {filtered.map((c) => (
          <button
            className="collection-item"
            key={c.id}
            onClick={() => view(c)}
            aria-label={'View ' + c.name}
          >
            <CardRenderer
              card={c}
              small
              hidden={!owned[c.id]}
              effectsActive={false}
            />
            <div className="ownership">
              {owned[c.id] ? (
                <>
                  In collection <b>×{owned[c.id]}</b>
                </>
              ) : (
                <>
                  Not discovered <span>◇</span>
                </>
              )}
            </div>
          </button>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty">
          <h2>No cards found</h2>
          <p>Try a different search or filter.</p>
          <button
            className="secondary"
            onClick={() => {
              setSearch('');
              setRarity('');
              setOnly(false);
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
