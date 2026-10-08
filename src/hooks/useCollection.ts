import { useState } from 'react';
import { cards } from '../data/cards';
import type { CardData, SaveData } from '../types';
const KEY = 'aetherveil-save-v1';
const fresh = (): SaveData => ({
  version: 1,
  owned: {},
  packs: 0,
  pending: [],
  sound: false,
});
function read(): SaveData {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!data || data.version !== 1) return fresh();
    const owned: Record<string, number> = {};
    for (const c of cards) {
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
            .filter((id: unknown) => cards.some((c) => c.id === id))
            .slice(0, 5)
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
    addPack: (pack: CardData[]) => {
      const owned = { ...save.owned };
      for (const c of pack) owned[c.id] = (owned[c.id] || 0) + 1;
      commit({
        ...save,
        owned,
        packs: save.packs + 1,
        pending: pack.map((c) => c.id),
      });
    },
    finish: () => commit({ ...save, pending: [] }),
    toggleSound: () => commit({ ...save, sound: !save.sound }),
  };
}
