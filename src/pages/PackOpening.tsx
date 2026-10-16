import { StackedCardReveal } from '../components/pack/StackedCardReveal';
import { NewCardBadge } from '../components/pack/NewCardBadge';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CardRenderer } from '../components/cards/CardRenderer';
import { BoosterPack } from '../components/pack/BoosterPack';
import { cardById, heroCards } from '../data/catalog';
import type { HeroCardData } from '../types/heroCard';
import { generatePack } from '../utils/packGenerator';
import { valuePack, formatPlayPrice } from '../utils/packValue';
import { playTone } from '../utils/sound';
import { PACK_SIZE, rarities, rarityWeights } from '../config/rarity';
const NO_NEW_CARDS: number[] = [];
export function PackOpening({
  pending,
  pendingNew = NO_NEW_CARDS,
  addPack,
  finish,
  sound,
  collect,
  view,
}: {
  pending: string[];
  pendingNew?: number[];
  addPack: (c: HeroCardData[]) => void;
  finish: () => void;
  sound: boolean;
  collect: () => void;
  view?: (card: HeroCardData) => void;
}) {
  const [phase, setPhase] = useState<
    'sealed' | 'tearing' | 'reveal' | 'results'
  >(pending.length ? 'reveal' : 'sealed');
  const [pack, setPack] = useState<HeroCardData[]>(() =>
    pending.map((id) => cardById.get(id)!).filter(Boolean),
  );
  const [selectedPack, setSelectedPack] = useState<number | null>(null);
  const [valuations, setValuations] = useState(() => valuePack(pack));
  const [newCards, setNewCards] = useState(pendingNew);
  const [odds, setOdds] = useState(false);
  const [forcedPull, setForcedPull] = useState('');
  const lock = useRef(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (pending.length) setNewCards(pendingNew);
  }, [pending, pendingNew]);
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
  function open(choice: number) {
    if (lock.current) return;
    lock.current = true;
    setSelectedPack(choice);
    const next = generatePack(Math.random, {
      forceCardId: forcedPull.startsWith('card:')
        ? forcedPull.slice(5)
        : undefined,
      forceRarity: forcedPull.startsWith('rarity:')
        ? rarities.find((rarity) => rarity === forcedPull.slice(7))
        : undefined,
    });
    setPack(next);
    setValuations(valuePack(next));
    addPack(next);
    playTone(sound, 2);
    setPhase('tearing');
  }
  function reset() {
    setSelectedPack(null);
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
            : 'Choose one of six royal boosters. Each holds five cards with identical odds.'}
      </p>
      <AnimatePresence mode="wait">
        {(phase === 'sealed' || phase === 'tearing') && (
          <motion.div
            key="pack"
            className="pack-stage pack-selection-stage"
            exit={{ opacity: 0, scale: 1.12 }}
          >
            <div className="pack-halo" aria-hidden="true" />
            <div className="summoning-circle" aria-hidden="true">
              <span>✧</span>
              <span>✧</span>
              <span>✧</span>
              <span>✧</span>
            </div>
            <div className="booster-choices" aria-label="Choose a booster pack">
              {Array.from({ length: 6 }, (_, choice) => (
                <motion.button
                  key={choice}
                  className="pack-button booster-choice"
                  aria-label={`Open booster pack ${choice + 1}, five cards, same odds`}
                  onClick={() => open(choice)}
                  disabled={phase === 'tearing'}
                  data-selected={selectedPack === choice}
                  animate={
                    phase === 'tearing' && selectedPack !== choice
                      ? { opacity: 0.2, scale: 0.92 }
                      : { opacity: 1, scale: 1 }
                  }
                  whileHover={
                    phase === 'sealed' && !reduced ? { y: -10 } : undefined
                  }
                  whileFocus={
                    phase === 'sealed' && !reduced ? { y: -10 } : undefined
                  }
                  transition={{ duration: reduced ? 0 : 0.25 }}
                >
                  <BoosterPack
                    tearing={phase === 'tearing' && selectedPack === choice}
                  />
                  <span className="booster-choice-label">
                    PACK {String(choice + 1).padStart(2, '0')}
                  </span>
                </motion.button>
              ))}
            </div>
            <div className="pack-instructions">
              {phase === 'tearing'
                ? 'BREAKING THE SEAL…'
                : 'CHOOSE A PACK TO BREAK THE SEAL'}
            </div>
          </motion.div>
        )}
        {phase === 'reveal' && (
          <motion.div
            key="reveal"
            className="reveal-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <StackedCardReveal
              cards={pack}
              newCards={newCards}
              sound={sound}
              onComplete={() => {
                finish();
                setPhase('results');
              }}
            />
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
                  <button
                    type="button"
                    className="discovery-card result-inspect"
                    aria-label={'Inspect ' + c.name}
                    onClick={() => view?.(c)}
                  >
                    <CardRenderer card={c} small />
                    {newCards.includes(i) && <NewCardBadge />}
                  </button>
                  <span className="result-rarity">{c.rarity}</span>
                  <span className="result-price">
                    {formatPlayPrice(valuations[i].price)}
                  </span>
                  {valuations[i].premium && (
                    <span className="result-premium">
                      ✦ Lucky appraisal · ×1.5
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
            <div className="pack-value-summary" role="status">
              <span className="eyebrow">
                THIS OPENING ONLY · {Math.ceil(pack.length / PACK_SIZE)} PACKS ·
                PLAY VALUE
              </span>
              <strong>
                {formatPlayPrice(
                  valuations.reduce((total, card) => total + card.price, 0),
                )}
              </strong>
              <p>
                มูลค่าจำลองเฉพาะรอบนี้ ({Math.ceil(pack.length / PACK_SIZE)}{' '}
                ซอง) · ไม่ใช่ราคาซื้อขายจริง
              </p>
              <details>
                <summary>วิธีคิดราคาเล่น ๆ</summary>
                <p>C ฿10 · U ฿30 · R ฿100 · SR ฿350 · UR ฿1,200 · SER ฿5,000</p>
                <p>
                  ราคาแกว่ง ±20% ต่อใบ และมีโอกาส 5% ได้ Lucky appraisal
                  เพิ่มมูลค่า ×1.5 ไม่มีผลต่ออัตราดรอป
                </p>
              </details>
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
            <span>{PACK_SIZE} cards per pack · Same odds</span>
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
