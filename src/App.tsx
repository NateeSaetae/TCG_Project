import type { CSSProperties } from 'react';
import { brand } from './config/brand';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Home } from './pages/Home';
import { Collection } from './pages/Collection';
import { PackOpening } from './pages/PackOpening';
import { Card } from './components/cards/Card';
import { useCollection } from './hooks/useCollection';
import type { CardData } from './types';
const DevShowcase = import.meta.env.DEV
  ? lazy(() => import('./pages/CardShowcase'))
  : null;
const DevMarth = import.meta.env.DEV
  ? lazy(() => import('./pages/MarthCommonPreview'))
  : null;
type Page = 'home' | 'packs' | 'collection' | 'showcase' | 'marth';
function currentPage(): Page {
  if (
    import.meta.env.DEV &&
    (location.hash === '#/dev/marth-common' ||
      (location.pathname === '/dev/marth-common' && !location.hash))
  )
    return 'marth';
  if (
    import.meta.env.DEV &&
    (location.hash === '#/dev/card-showcase' ||
      (location.pathname === '/dev/card-showcase' && !location.hash))
  )
    return 'showcase';
  return location.hash === '#packs'
    ? 'packs'
    : location.hash === '#collection'
      ? 'collection'
      : 'home';
}
export default function App() {
  const [page, setPage] = useState<Page>(currentPage);
  const [viewer, setViewer] = useState<CardData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const { save, error, addPack, finish, toggleSound } = useCollection();
  useEffect(() => {
    const listener = () => setPage(currentPage());
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, []);
  useEffect(() => {
    setDetailsOpen(false);
    if (viewer) dialog.current?.showModal();
    else dialog.current?.close();
  }, [viewer]);
  function go(next: Page) {
    location.hash = next;
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  return (
    <div
      className="app-shell royal-theme"
      style={
        {
          '--court-art': 'url("' + brand.assets.background + '")',
        } as CSSProperties
      }
    >
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        Skip to content
      </a>
      <div className="environment" aria-hidden="true" />
      <header className="site-header">
        <button
          className="brand"
          onClick={() => go('home')}
          aria-label={brand.name + ' home'}
        >
          <img className="brand-crest" src={brand.assets.crest} alt="" />
          <span>
            {brand.name}
            <small>{brand.subtitle}</small>
          </span>
        </button>
        <nav aria-label="Main navigation">
          {(['home', 'packs', 'collection'] as Page[]).map((p) => (
            <button
              key={p}
              onClick={() => go(p)}
              className={page === p ? 'active' : ''}
              aria-current={page === p ? 'page' : undefined}
            >
              {p === 'home'
                ? 'Home'
                : p === 'packs'
                  ? 'Open Packs'
                  : 'Hero Archive'}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <span className="local-badge">
            <i /> LOCAL PLAY
          </span>
          <button
            className="sound-button"
            aria-label={save.sound ? 'Mute sound' : 'Enable sound'}
            aria-pressed={save.sound}
            onClick={toggleSound}
          >
            {save.sound ? '♫' : '♪'}
            <span>{save.sound ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </header>
      {error && (
        <div className="storage-warning" role="alert">
          {error}
        </div>
      )}
      <main id="main-content" tabIndex={-1}>
        {page === 'marth' && DevMarth ? (
          <Suspense fallback={<p>Loading Common preview…</p>}>
            <DevMarth />
          </Suspense>
        ) : page === 'showcase' && DevShowcase ? (
          <Suspense fallback={<p>Loading showcase…</p>}>
            <DevShowcase sound={save.sound} />
          </Suspense>
        ) : page === 'home' ? (
          <Home
            open={() => go('packs')}
            collect={() => go('collection')}
            owned={Object.keys(save.owned).length}
            packs={save.packs}
          />
        ) : page === 'packs' ? (
          <PackOpening
            pending={save.pending}
            addPack={addPack}
            finish={finish}
            sound={save.sound}
            collect={() => go('collection')}
          />
        ) : (
          <Collection owned={save.owned} view={setViewer} />
        )}
      </main>
      <footer className="royal-footer">
        <span>✧ {brand.subtitle}</span>
        <span>
          Private local fan project · Not affiliated with Nintendo or
          Intelligent Systems
        </span>
      </footer>
      <dialog
        ref={dialog}
        className="card-dialog focused-card-dialog"
        aria-label="Card viewer"
        onCancel={() => setViewer(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setViewer(null);
        }}
      >
        {viewer && (
          <div
            className="focused-viewer"
            data-details-open={detailsOpen}
            onClick={(event) => {
              if (event.target === event.currentTarget) setViewer(null);
            }}
          >
            <button
              className="close-viewer"
              onClick={() => setViewer(null)}
              aria-label="Close card viewer"
            >
              ×
            </button>
            <div className="focused-card-stage">
              <Card card={viewer} hidden={!save.owned[viewer.id]} />
              <p className="focused-card-hint">
                Move your cursor to explore the card
              </p>
            </div>
            {/* <button
              className="viewer-detail-toggle"
              aria-expanded={detailsOpen}
              aria-controls="card-detail-panel"
              onClick={() => setDetailsOpen((value) => !value)}
            >
              <span aria-hidden="true">{detailsOpen ? '×' : 'ⓘ'}</span>
              {detailsOpen ? 'Hide details' : 'Card details'}
            </button> */}
            {detailsOpen && (
              <aside
                id="card-detail-panel"
                className="viewer-details focused-detail-panel"
                aria-label="Card details"
              >
                <div className="eyebrow">{viewer.set}</div>
                <h2>
                  {save.owned[viewer.id]
                    ? viewer.name
                    : 'An undiscovered legend'}
                </h2>
                <p>
                  {viewer.rarity} · {viewer.element} · {viewer.cardType}
                </p>
                <p>
                  {save.owned[viewer.id]
                    ? viewer.description
                    : 'Open boosters to discover this card and reveal its story.'}
                </p>
                <span className="viewer-owned">
                  {save.owned[viewer.id]
                    ? 'Owned ×' + save.owned[viewer.id]
                    : 'Not collected yet'}
                </span>
                <dl className="viewer-card-stats">
                  <div>
                    <dt>Cost</dt>
                    <dd>{save.owned[viewer.id] ? viewer.cost : '—'}</dd>
                  </div>
                  <div>
                    <dt>Attack</dt>
                    <dd>{save.owned[viewer.id] ? viewer.attack : '—'}</dd>
                  </div>
                  <div>
                    <dt>Defense</dt>
                    <dd>{save.owned[viewer.id] ? viewer.defense : '—'}</dd>
                  </div>
                  <div>
                    <dt>Card number</dt>
                    <dd>{String(viewer.cardNumber).padStart(3, '0')} / 030</dd>
                  </div>
                </dl>
              </aside>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
