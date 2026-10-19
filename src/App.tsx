import type { CSSProperties } from 'react';
import { brand } from './config/brand';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Home } from './pages/Home';
import { Collection } from './pages/Collection';
import { PackOpening } from './pages/PackOpening';
import { CardRenderer } from './components/cards/CardRenderer';
import { useCollection } from './hooks/useCollection';
import type { HeroCardData } from './types/heroCard';

const DevHeroes = import.meta.env.DEV
  ? lazy(() => import('./pages/dev/HeroPreview'))
  : null;
const DevGameplaySandbox = import.meta.env.DEV
  ? lazy(() => import('./gameplay/mvp/ui/GameplaySandbox'))
  : null;

type Page = 'home' | 'packs' | 'collection' | 'heroes' | 'sandbox';

function currentPage(): Page {
  if (
    import.meta.env.DEV &&
    (location.hash === '#/dev/gameplay-sandbox' ||
      (location.pathname === '/dev/gameplay-sandbox' && !location.hash))
  )
    return 'sandbox';
  if (
    import.meta.env.DEV &&
    (location.hash === '#/dev/heroes' ||
      location.hash === '#/dev/marth-common' ||
      (['/dev/heroes', '/dev/marth-common'].includes(location.pathname) &&
        !location.hash))
  )
    return 'heroes';
  return location.hash === '#packs'
    ? 'packs'
    : location.hash === '#collection'
      ? 'collection'
      : 'home';
}

export default function App() {
  const [page, setPage] = useState<Page>(currentPage);
  const [viewer, setViewer] = useState<HeroCardData | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const { save, error, addPack, finish, toggleSound } = useCollection();

  useEffect(() => {
    const listener = () => setPage(currentPage());
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, []);

  useEffect(() => {
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
          {import.meta.env.DEV && (
            <button
              onClick={() => {
                location.hash = '/dev/gameplay-sandbox';
                setPage('sandbox');
              }}
              className={page === 'sandbox' ? 'active' : ''}
              aria-current={page === 'sandbox' ? 'page' : undefined}
            >
              Gameplay Sandbox
            </button>
          )}
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
        {page === 'sandbox' && DevGameplaySandbox ? (
          <Suspense fallback={<p>Loading Gameplay Sandbox…</p>}>
            <DevGameplaySandbox />
          </Suspense>
        ) : page === 'heroes' && DevHeroes ? (
          <Suspense fallback={<p>Loading hero preview…</p>}>
            <DevHeroes />
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
            view={setViewer}
            pendingNew={save.pendingNew}
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
              <CardRenderer card={viewer} hidden={!save.owned[viewer.id]} />
              <p className="focused-card-hint">
                Move your cursor to explore the card
              </p>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
