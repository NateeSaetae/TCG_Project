import { CardReveal } from '../components/pack/CardReveal';
import { SecretRareReveal } from '../components/pack/SecretRareReveal';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CardRenderer } from '../components/cards/CardRenderer';
import { BoosterPack } from '../components/pack/BoosterPack';
import { cardById, heroCards } from '../data/catalog';
import type { HeroCardData } from '../types/heroCard';
import { generatePack } from '../utils/packGenerator';
import { playTone } from '../utils/sound';
import { PACK_SIZE, rank, rarities, rarityWeights } from '../config/rarity';
export function PackOpening({
  pending,
  addPack,
  finish,
  sound,
  collect,
}: {
  pending: string[];
  addPack: (c: HeroCardData[]) => void;
  finish: () => void;
  sound: boolean;
  collect: () => void;
}) {
  const [phase, setPhase] = useState<
    'sealed' | 'tearing' | 'reveal' | 'results'
  >(pending.length ? 'reveal' : 'sealed');
  const [pack, setPack] = useState<HeroCardData[]>(() =>
    pending.map((id) => cardById.get(id)!).filter(Boolean),
  );
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [odds, setOdds] = useState(false);
  const [forcedPull, setForcedPull] = useState('');
  const lock = useRef(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (phase !== 'tearing') return;
    const timer = setTimeout(
      () => {
        setPhase('reveal');
        lock.current = false;
      },
      reduced ? 50 : 1400,
    );
    return () => clearTimeout(timer);
  }, [phase, reduced]);
  function open() {
    if (lock.current) return;
    lock.current = true;
    const next = generatePack(Math.random, {
      forceCardId: forcedPull.startsWith('card:')
        ? forcedPull.slice(5)
        : undefined,
      forceRarity: forcedPull.startsWith('rarity:')
        ? rarities.find((rarity) => rarity === forcedPull.slice(7))
        : undefined,
    });
    setPack(next);
    addPack(next);
    playTone(sound, 2);
    setPhase('tearing');
  }
  function reveal() {
    if (!flipped) {
      setFlipped(true);
      playTone(sound, rank(pack[index].rarity));
    } else if (index < pack.length - 1) {
      setIndex(index + 1);
      setFlipped(false);
    } else {
      finish();
      setPhase('results');
    }
  }
  function reset() {
    setIndex(0);
    setFlipped(false);
    setPhase('sealed');
    lock.current = false;
  }
  return (
    <section className="opening-page">
      <div className="eyebrow">THE SUMMONING CHAMBER · CHAPTER I</div>
      <h1>
        {phase === 'results'
          ? 'Your heroes have arrived.'
          : phase === 'reveal'
            ? 'A hero answers your call.'
            : 'Call forth your next legend.'}
      </h1>
      <p className="opening-subtitle">
        {phase === 'results'
          ? 'Your new discoveries have been added to the Hero Archive.'
          : phase === 'reveal'
            ? 'Take your time. Some moments are worth revealing.'
            : 'Unseal a royal booster. Five cards await your summons.'}
      </p>
      <AnimatePresence mode="wait">
        {(phase === 'sealed' || phase === 'tearing') && (
          <motion.div
            key="pack"
            className="pack-stage"
            exit={{ opacity: 0, scale: 1.12 }}
          >
            <div className="pack-halo" aria-hidden="true" />
            <div className="summoning-circle" aria-hidden="true">
              <span>✧</span>
              <span>✧</span>
              <span>✧</span>
              <span>✧</span>
            </div>
            <motion.button
              className="pack-button"
              aria-label="Tear open booster pack"
              onClick={open}
              disabled={phase === 'tearing'}
              drag={phase === 'sealed' ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 60) open();
              }}
              animate={
                !reduced && phase === 'sealed'
                  ? { y: [0, -12, 0], rotate: [-3, 1, -3] }
                  : {}
              }
              transition={{ duration: 5, repeat: Infinity }}
            >
              <BoosterPack tearing={phase === 'tearing'} />
            </motion.button>
            <div className="pack-instructions">
              {phase === 'tearing'
                ? 'BREAKING THE SEAL…'
                : 'CLICK OR SWIPE THE PACK TO BREAK THE SEAL'}
            </div>
          </motion.div>
        )}
        {phase === 'reveal' && (
          <motion.div
            key="reveal"
            className="reveal-stage"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              className={
                'reveal-aura tier-' + (flipped ? rank(pack[index].rarity) : 0)
              }
            />
            {flipped && rank(pack[index].rarity) >= 3 && (
              <div className="spark-burst" aria-hidden="true">
                {Array.from({ length: 16 }, (_, i) => (
                  <i
                    key={i}
                    style={{
                      transform:
                        'rotate(' + i * 22.5 + 'deg) translateY(-220px)',
                    }}
                  />
                ))}
              </div>
            )}
            {rank(pack[index].rarity) === 5 ? (
              <SecretRareReveal
                key={index + '-' + pack[index].id}
                card={pack[index]}
                revealed={flipped}
                onReveal={() => setFlipped(true)}
                onContinue={reveal}
                sound={sound}
              />
            ) : (
              <CardReveal
                key={index + '-' + pack[index].id}
                card={pack[index]}
                onReveal={() => setFlipped(true)}
                onContinue={reveal}
                sound={sound}
              />
            )}
            <div className="reveal-label" aria-live="polite">
              {flipped
                ? pack[index].rarity.toUpperCase()
                : 'THE UNKNOWN AWAITS'}
              <small>
                {flipped
                  ? index === pack.length - 1
                    ? 'Click to see your discoveries'
                    : 'Click to continue'
                  : 'Click the card to reveal'}
              </small>
            </div>
            <div className="reveal-dots">
              {pack.map((_, i) => (
                <i className={i <= index ? 'active' : ''} key={i} />
              ))}
            </div>
            <button
              className="text-button skip"
              onClick={() => {
                finish();
                setPhase('results');
              }}
            >
              Reveal all →
            </button>
          </motion.div>
        )}
        {phase === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="results-grid">
              {pack.map((c, i) => (
                <motion.div
                  key={c.id + '-' + i}
                  initial={{ y: reduced ? 0 : 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: reduced ? 0 : i * 0.12 }}
                >
                  <CardRenderer card={c} small />
                  <span className="result-rarity">{c.rarity}</span>
                </motion.div>
              ))}
            </div>
            <div className="result-actions">
              <button className="primary" onClick={reset}>
                Open another booster ↗
              </button>
              <button className="secondary" onClick={collect}>
                View Hero Archive →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {phase === 'sealed' && (
        <>
          <div className="pack-meta">
            <span>✧ &nbsp; Rare+ guaranteed</span>
            <span>{PACK_SIZE} cards</span>
            <span>Free to discover</span>
          </div>
          <button
            className="text-button odds-button"
            onClick={() => setOdds(!odds)}
            aria-expanded={odds}
          >
            Drop rates {odds ? '−' : '+'}
          </button>
          {odds && (
            <div className="odds">
              {rarities.map((r) => (
                <span key={r}>
                  {r}
                  <b>{rarityWeights[r]}%</b>
                </span>
              ))}
              <p>
                Base rarity weights. If the first four cards have no Rare+, the
                final slot draws only from Rare and above. Weights are
                normalized over eligible rarities; copies can repeat within a
                pack.
              </p>
            </div>
          )}
          {import.meta.env.DEV && (
            <label className="pack-debug-control">
              Test pull
              <select
                aria-label="Force a card or rarity in the next pack"
                value={forcedPull}
                onChange={(event) => setForcedPull(event.target.value)}
              >
                <option value="">Normal odds</option>
                {rarities.map((rarity) => (
                  <option key={rarity} value={'rarity:' + rarity}>
                    Force {rarity}
                  </option>
                ))}
                {heroCards.map((card) => (
                  <option key={card.id} value={'card:' + card.id}>
                    Force {card.id}
                  </option>
                ))}
              </select>
            </label>
          )}
        </>
      )}
    </section>
  );
}
