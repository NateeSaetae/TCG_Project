import { useState } from 'react';
import { archiveCards, cardById } from '../data/catalog';
import type { HeroCardData } from '../types/heroCard';
import { MAX_PACKS, PACK_SIZE } from '../config/rarity';
import type { SaveData } from '../types';
// Start a fresh archive once; subsequent visits retain the new collection.
const KEY = 'aetherveil-save-v2';
const fresh = (): SaveData => ({
  version: 1,
  owned: {},
  packs: 0,
  pending: [],
  pendingNew: [],
  sound: false,
});
function read(): SaveData {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!data || data.version !== 1) return fresh();
    const owned: Record<string, number> = {};
    for (const c of archiveCards) {
      const n = data.owned?.[c.id];
      if (Number.isSafeInteger(n) && n > 0) owned[c.id] = n;
    }
    return {
      version: 1,
      owned,
      packs:
        Number.isSafeInteger(data.packs) && data.packs >= 0 ? data.packs : 0,
      pending: Array.isArray(data.pending)
        ? data.pending
            .filter(
              (id: unknown): id is string =>
                typeof id === 'string' && cardById.has(id),
            )
            .slice(0, PACK_SIZE * MAX_PACKS)
        : [],
      pendingNew: Array.isArray(data.pendingNew)
        ? data.pendingNew.filter(
            (i: unknown): i is number =>
              typeof i === 'number' &&
              Number.isInteger(i) &&
              i >= 0 &&
              i < PACK_SIZE * MAX_PACKS,
          )
        : [],
      sound: data.sound === true,
    };
  } catch {
    return fresh();
  }
}
export function useCollection() {
  const [save, setSave] = useState(read);
  const [error, setError] = useState('');
  function commit(next: SaveData) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setError('');
    } catch {
      setError(
        'Storage unavailable. Keep this tab open to retain this session.',
      );
    }
    setSave(next);
  }
  return {
    save,
    error,
    addPack: (pack: HeroCardData[]) => {
      const owned = { ...save.owned };
      const pendingNew: number[] = [];
      pack.forEach((c, index) => {
        if (!owned[c.id]) pendingNew.push(index);
        owned[c.id] = (owned[c.id] || 0) + 1;
      });
      commit({
        ...save,
        owned,
        packs: save.packs + Math.ceil(pack.length / PACK_SIZE),
        pending: pack.map((c) => c.id),
        pendingNew,
      });
    },
    finish: () => commit({ ...save, pending: [], pendingNew: [] }),
    toggleSound: () => commit({ ...save, sound: !save.sound }),
  };
}
