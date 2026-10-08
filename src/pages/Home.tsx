import { motion, useReducedMotion } from 'framer-motion';
import { Card } from '../components/cards/Card';
import { cards } from '../data/cards';
export function Home({
  open,
  collect,
  owned,
  packs,
}: {
  open: () => void;
  collect: () => void;
  owned: number;
  packs: number;
}) {
  const reduced = useReducedMotion();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <i /> A NEW CHAPTER · THE HERO COLLECTION
          </div>
          <h1>
            Legends answer.
            <br />
            <em>Your story begins.</em>
          </h1>
          <p>
            Gather heroes. Uncover rare treasures.
            <br className="desktop" /> Build a collection worthy of the royal
            archives.
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={open}>
              ✧ &nbsp; Open Booster <span>↗</span>
            </button>
            <button className="text-button" onClick={collect}>
              View Collection →
            </button>
          </div>
          <div className="hero-note">
            <span>5 cards per pack</span>
            <b>·</b>
            <span>Rare or better guaranteed</span>
          </div>
        </div>
        <div className="hero-display">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="ambient-star s1">✧</span>
          <span className="ambient-star s2">✦</span>
          <motion.div
            className="hero-card side-left"
            initial={reduced ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <Card card={cards[24]} />
          </motion.div>
          <motion.div
            className="hero-card side-right"
            initial={reduced ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15 }}
          >
            <Card card={cards[28]} />
          </motion.div>
          <motion.div
            className="hero-card center-card"
            initial={reduced ? false : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <Card card={cards[29]} />
          </motion.div>
          <div className="display-caption">
            ✧ &nbsp; HEROES OF THE FIRST CHAPTER
          </div>
        </div>
      </section>
      <section className="home-bottom">
        <div className="set-intro">
          <div className="eyebrow">INSCRIBED IN THE ARCHIVES</div>
          <h2>A legacy worth collecting.</h2>
          <p>
            Thirty cards await. Discover each story, one summoning at a time.
          </p>
          <div className="element-list">
            ☀ Fire &nbsp; ≈ Water &nbsp; ❧ Nature &nbsp; ✧ Light &nbsp; ☾ Dark
            &nbsp; ⟡ Arcane
          </div>
        </div>
        <button className="collection-summary" onClick={collect}>
          <span>YOUR HERO ARCHIVE</span>
          <div>
            <b>
              {owned}
              <small> / 30</small>
            </b>
            <span>↗</span>
          </div>
          <div className="progress-track">
            <i style={{ width: (owned / 30) * 100 + '%' }} />
          </div>
          <footer>
            {packs} boosters opened{' '}
            <span>{Math.round((owned / 30) * 100)}% complete</span>
          </footer>
        </button>
      </section>
      <div className="page-foot">
        <span>THE HERO COLLECTION · PROTOTYPE EDITION</span>
        <span>CHAPTER I — 030 CARDS</span>
      </div>
    </>
  );
}
