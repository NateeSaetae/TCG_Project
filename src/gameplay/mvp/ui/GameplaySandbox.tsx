import { useEffect, useState } from 'react';
import { heroCards } from '../../../data/catalog';
import { CardRenderer } from '../../../components/cards/CardRenderer';
import type { HeroCardData } from '../../../types/heroCard';
import type { BattlefieldPosition, MvpCombatant } from '../types';
import { createTestMatch, testCharacterById } from '../data/testMatch';
import { chooseBotAction } from '../bot/testBot';
import {
  applyMatchAction,
  EVENT_NAMES,
  type EventType,
  type MatchAction,
  type PlayerId,
  type PlayerState,
} from '../state/match';
import './gameplay-sandbox.css';

const boardPositions: BattlefieldPosition[] = [0, 1, 2, 3, 4];
const commonCards = new Map<string, HeroCardData>();
for (const card of heroCards) {
  const id = card.gameplay?.id;
  if (id && !commonCards.has(id)) commonCards.set(id, card);
}

function nameOf(character: MvpCombatant) {
  const name = commonCards.get(character.characterId)?.name;
  return name ?? character.characterId;
}

function Board({
  player,
  selected,
  onSelect,
}: {
  player: PlayerState;
  selected: BattlefieldPosition;
  onSelect: (position: BattlefieldPosition) => void;
}) {
  return (
    <div
      className="mvp-board"
      role="group"
      aria-label={`Player ${player.id} battlefield`}
    >
      {boardPositions.map((position) => {
        const character = player.board[position];
        const card = character ? commonCards.get(character.characterId) : null;
        return (
          <button
            type="button"
            className={
              'mvp-slot' + (selected === position ? ' is-selected' : '')
            }
            key={position}
            onClick={() => onSelect(position)}
            aria-pressed={selected === position}
            aria-label={`Player ${player.id} slot ${position}: ${character ? nameOf(character) : 'empty'}`}
          >
            <span className="mvp-slot-number">{position}</span>
            {character ? (
              <>
                <span className="mvp-portrait">
                  {card && <img src={card.image} alt="" draggable={false} />}
                </span>
                <strong>{nameOf(character)}</strong>
                <span className="mvp-weapon">{character.weapon}</span>
                <span className="mvp-hp">HP {character.currentHp}/10</span>
                <span className="mvp-flags">
                  {character.newlyDeployed && <small>New</small>}
                  {character.exhausted && <small>Exhausted</small>}
                  {character.rally && <small>Rally</small>}
                  {character.defensiveStance && <small>Stance</small>}
                </span>
              </>
            ) : (
              <span className="mvp-empty">Empty</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function GameplaySandbox() {
  const [mode, setMode] = useState<'bot' | 'local'>('bot');
  const [firstPlayerId, setFirstPlayerId] = useState<PlayerId>('one');
  const [match, setMatch] = useState(() => createTestMatch('one'));
  const [ownPosition, setOwnPosition] = useState<BattlefieldPosition>(1);
  const [targetPosition, setTargetPosition] = useState<BattlefieldPosition>(1);
  const [repositionPosition, setRepositionPosition] =
    useState<BattlefieldPosition>(0);
  const [handId, setHandId] = useState('');
  const [weapon, setWeapon] = useState('');
  const [eventType, setEventType] = useState<EventType>('heal');
  const [message, setMessage] = useState(
    'Select a character, then choose an action.',
  );

  const active = match.players.find(
    (player) => player.id === match.activePlayerId,
  )!;
  const opponent = match.players.find(
    (player) => player.id !== match.activePlayerId,
  )!;
  const selected = active.board[ownPosition];
  const repositionTargets = boardPositions.filter(
    (position) => Math.abs(position - ownPosition) === 1,
  );
  const chosenRepositionPosition = repositionTargets.includes(
    repositionPosition,
  )
    ? repositionPosition
    : repositionTargets[0];
  const repositionTarget = active.board[chosenRepositionPosition];
  const selectedHand = active.hand.find((entry) => entry.instanceId === handId);
  const selectedWeapon = selected?.allowedWeapons.find(
    (entry) => entry === weapon,
  );
  const availableEvent = active.availableEvents.includes(eventType)
    ? eventType
    : active.availableEvents[0];
  const selectedCard = selected ? commonCards.get(selected.characterId) : null;
  const botTurn =
    mode === 'bot' && match.activePlayerId === 'two' && !match.winner;

  useEffect(() => {
    if (mode !== 'bot' || match.activePlayerId !== 'two' || match.winner)
      return;
    const timer = window.setTimeout(() => {
      const action = chooseBotAction(match, 'two');
      if (!action) return;
      try {
        const next = applyMatchAction(match, action);
        setMatch(next);
        setMessage(`Bot: ${next.log.slice(match.log.length).join(' ')}`);
      } catch (error) {
        setMessage(
          error instanceof Error ? `Bot error: ${error.message}` : 'Bot error',
        );
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [match, mode]);

  function run(action: MatchAction) {
    if (botTurn) return;
    try {
      const next = applyMatchAction(match, action);
      setMatch(next);
      if (action.kind === 'move' || action.kind === 'swap')
        setOwnPosition(action.toPosition);
      setMessage(next.log.at(-1) ?? 'Action completed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action unavailable');
    }
  }

  function reset() {
    setMatch(createTestMatch(firstPlayerId));
    setOwnPosition(1);
    setTargetPosition(1);
    setRepositionPosition(0);
    setHandId('');
    setMessage('New test match started.');
  }

  return (
    <section className="mvp-sandbox">
      <div className="eyebrow">DEVELOPMENT · GAMEPLAY MVP VER.1</div>
      <div className="mvp-heading">
        <div>
          <h1>Gameplay Sandbox</h1>
          <p>
            Click a slot, then use the controls below. Player two can be a test
            bot.
          </p>
        </div>
        <div className="mvp-setup">
          <label>
            Opponent
            <select
              value={mode}
              onChange={(event) => {
                setMode(event.target.value as 'bot' | 'local');
                setMatch(createTestMatch(firstPlayerId));
                setMessage('New test match started.');
              }}
            >
              <option value="bot">Test bot</option>
              <option value="local">Local player</option>
            </select>
          </label>
          <label>
            First player
            <select
              value={firstPlayerId}
              onChange={(event) =>
                setFirstPlayerId(event.target.value as PlayerId)
              }
            >
              <option value="one">Player one</option>
              <option value="two">Player two</option>
            </select>
          </label>
          <button className="secondary" type="button" onClick={reset}>
            Reset match
          </button>
        </div>
      </div>

      <div className="mvp-scoreboard">
        {match.players.map((player) => (
          <div
            key={player.id}
            className={match.activePlayerId === player.id ? 'is-active' : ''}
          >
            <strong>
              Player {player.id}
              {mode === 'bot' && player.id === 'two' ? ' · Bot' : ''}
            </strong>
            <span>{player.kos}/5 KOs</span>
          </div>
        ))}
        <div className="mvp-turn">
          Turn {match.turn} ·{' '}
          {match.winner
            ? `Player ${match.winner} wins`
            : botTurn
              ? 'Bot is choosing an action…'
              : `Player ${match.activePlayerId} to act`}
        </div>
      </div>

      <div className="mvp-battlefield">
        <div className="mvp-side-label">OPPONENT · PLAYER {opponent.id}</div>
        <Board
          player={opponent}
          selected={targetPosition}
          onSelect={setTargetPosition}
        />
        <div className="mvp-divider">VS</div>
        <div className="mvp-side-label">ACTIVE · PLAYER {active.id}</div>
        <Board
          player={active}
          selected={ownPosition}
          onSelect={setOwnPosition}
        />
      </div>

      <div className="mvp-lower">
        <div className="mvp-controls">
          <div className="mvp-action-counts">
            <span>
              Main Actions <b>{active.mainActions}/3</b>
            </span>
            <span>
              Item Actions <b>{active.itemActions}/3</b>
            </span>
            <span>
              Attacks <b>{active.attacks}/2</b>
            </span>
            <span>
              Move / Swap <b>{active.repositions}/2</b>
            </span>
          </div>
          <div className="mvp-selection">
            <span>
              Friendly slot <b>{ownPosition}</b>
              {selected ? ` · ${nameOf(selected)}` : ' · empty'}
            </span>
            <span>
              Enemy slot <b>{targetPosition}</b>
            </span>
          </div>
          <div className="mvp-action-grid">
            <div className="mvp-control-group">
              <h2>Attack</h2>
              <p>Selected friendly character → selected enemy.</p>
              <button
                className="primary"
                type="button"
                disabled={Boolean(match.winner) || botTurn}
                onClick={() =>
                  run({
                    kind: 'attack',
                    attackerPosition: ownPosition,
                    targetPosition,
                  })
                }
              >
                Attack
              </button>
            </div>
            <div className="mvp-control-group">
              <h2>Deploy</h2>
              <p>Choose a hero in hand and an empty friendly slot.</p>
              <select
                value={selectedHand?.instanceId ?? ''}
                onChange={(event) => setHandId(event.target.value)}
              >
                <option value="">Select from hand</option>
                {active.hand.map((character) => (
                  <option
                    key={character.instanceId}
                    value={character.instanceId}
                  >
                    {nameOf(character)} · HP {character.currentHp}
                  </option>
                ))}
              </select>
              <button
                className="secondary"
                type="button"
                disabled={Boolean(match.winner) || botTurn || !selectedHand}
                onClick={() =>
                  run({
                    kind: 'deploy',
                    handId: selectedHand!.instanceId,
                    position: ownPosition,
                  })
                }
              >
                Deploy
              </button>
            </div>
            <div className="mvp-control-group">
              <h2>Move / Swap</h2>
              <p>
                Move into an adjacent empty slot, or swap with an eligible
                adjacent ally.
              </p>
              <select
                value={chosenRepositionPosition ?? ''}
                onChange={(event) =>
                  setRepositionPosition(
                    Number(event.target.value) as BattlefieldPosition,
                  )
                }
              >
                {repositionTargets.length === 0 && (
                  <option value="">No adjacent slot</option>
                )}
                {repositionTargets.map((position) => (
                  <option key={position} value={position}>
                    Slot {position} ·{' '}
                    {active.board[position]
                      ? `Swap with ${nameOf(active.board[position])}`
                      : 'Move here'}
                  </option>
                ))}
              </select>
              <button
                className="secondary"
                type="button"
                disabled={
                  Boolean(match.winner) ||
                  botTurn ||
                  !selected ||
                  selected.newlyDeployed ||
                  selected.exhausted ||
                  chosenRepositionPosition === undefined ||
                  Boolean(
                    repositionTarget?.newlyDeployed ||
                    repositionTarget?.exhausted,
                  ) ||
                  active.repositions >= 2
                }
                onClick={() =>
                  run({
                    kind: repositionTarget ? 'swap' : 'move',
                    fromPosition: ownPosition,
                    toPosition: chosenRepositionPosition!,
                  })
                }
              >
                {repositionTarget ? 'Swap' : 'Move'}
              </button>
            </div>
            <div className="mvp-control-group">
              <h2>Equip / change</h2>
              <p>Weapon choice only; no Item stats or effects yet.</p>
              <select
                value={selectedWeapon ?? ''}
                onChange={(event) => setWeapon(event.target.value)}
              >
                <option value="">Select weapon</option>
                {selected?.allowedWeapons.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button
                className="secondary"
                type="button"
                disabled={Boolean(match.winner) || botTurn || !selectedWeapon}
                onClick={() =>
                  run({
                    kind: 'equip',
                    position: ownPosition,
                    weapon: selectedWeapon!,
                  })
                }
              >
                Use Item Action
              </button>
            </div>
            <div className="mvp-control-group mvp-event-control">
              <h2>Event</h2>
              <p>
                One Event per turn; each type is available once per player per
                match.
              </p>
              <select
                value={availableEvent ?? ''}
                onChange={(event) =>
                  setEventType(event.target.value as EventType)
                }
              >
                {active.availableEvents.length === 0 && (
                  <option value="">No Events left</option>
                )}
                {active.availableEvents.map((option) => (
                  <option key={option} value={option}>
                    {EVENT_NAMES[option]}
                  </option>
                ))}
              </select>
              <button
                className="secondary"
                type="button"
                disabled={Boolean(match.winner) || botTurn || !availableEvent}
                onClick={() =>
                  run({
                    kind: 'event',
                    event: availableEvent!,
                    position: ownPosition,
                  })
                }
              >
                Use Event on friendly slot
              </button>
            </div>
          </div>
          <div className="mvp-control-footer">
            <button
              className="primary"
              type="button"
              disabled={Boolean(match.winner) || botTurn}
              onClick={() => run({ kind: 'end-turn' })}
            >
              End Turn
            </button>
            <p role="status">{message}</p>
          </div>
        </div>
        <aside className="mvp-aside">
          <h2>Selected hero</h2>
          {selectedCard ? (
            <>
              <div className="mvp-card-preview">
                <CardRenderer card={selectedCard} small effectsActive={false} />
              </div>
              <p>
                Card print stats and skills are visual only. This match uses 10
                HP and MVP weapon rules.
              </p>
              <p>{testCharacterById.get(selected!.characterId)?.displayType}</p>
            </>
          ) : (
            <p>Choose an occupied friendly slot to inspect its card.</p>
          )}
          <h2>Match log</h2>
          <ol className="mvp-log">
            {match.log.slice(-12).map((entry, index) => (
              <li key={`${match.log.length - 12 + index}-${entry}`}>{entry}</li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
