import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { heroCards } from '../../../data/catalog';
import { CardBack } from '../../../components/cards/CardBack';
import type { BattlefieldPosition, MvpHandCard } from '../types';
import { createTestMatch } from '../data/testMatch';
import { createStarterMatch, starterCharacterCards } from '../data/starterDeck';
import { isCombatant } from '../state/deck';
import { chooseBotAction } from '../bot/testBot';
import { previewMatchAttack, type CombatPreview } from '../state/attackPreview';
import { legalAttackTargets } from './attackSelection';
import { visibleCardInstance, visiblePlayers } from './sandboxView';
import { GameplayCardFace } from './GameplayCard';
import { nameOfCombatant } from './gameplayCardData';
import { CardInspectionPanel } from './CardInspectionPanel';
import { GameplayPiles } from './GameplayPiles';
import {
  beginActionAnimation,
  beginCombatAnimation,
  damagePopupLabel,
  type CombatAnimationSession,
  type CombatAnimationStep,
} from './combatAnimation';
import {
  actionForDrop,
  legalDropTargets,
  type DragSource,
  type DropTarget,
} from './dragActions';
import {
  applyMatchAction,
  EVENT_NAMES,
  type MatchAction,
  type PlayerId,
  type PlayerState,
} from '../state/match';
import './gameplay-sandbox.css';
import './gameplay-board.css';

const boardPositions: BattlefieldPosition[] = [0, 1, 2, 3, 4];
const nameOf = nameOfCombatant;

function handLabel(card: MvpHandCard) {
  return isCombatant(card)
    ? `${nameOf(card)} · HP ${card.currentHp}/10`
    : card.kind === 'item'
      ? `${card.weapon} Item`
      : EVENT_NAMES[card.event];
}

type SetupChoice = { instanceId: string; position: BattlefieldPosition };
const initialChoices: Record<PlayerId, [SetupChoice, SetupChoice]> = {
  one: [
    { instanceId: 'one-character-0', position: 1 },
    { instanceId: 'one-character-5', position: 2 },
  ],
  two: [
    { instanceId: 'two-character-2', position: 1 },
    { instanceId: 'two-character-3', position: 2 },
  ],
};

function Board({
  player,
  selected,
  kind,
  legalTargets = [],
  handTargets = [],
  hovered = null,
  dragSource = null,
  onSelect,
  onPointerStart,
  onPointerMove,
  onPointerEnd,
  onPointerCancel,
  combatStep = null,
  afterPlayer = null,
}: {
  player: PlayerState;
  selected: BattlefieldPosition | null;
  kind: 'friendly' | 'enemy';
  legalTargets?: readonly BattlefieldPosition[];
  handTargets?: readonly BattlefieldPosition[];
  hovered?: BattlefieldPosition | null;
  dragSource?: BattlefieldPosition | null;
  onSelect: (position: BattlefieldPosition) => void;
  onPointerStart?: (
    position: BattlefieldPosition,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => void;
  onPointerMove?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerEnd?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerCancel?: () => void;
  combatStep?: CombatAnimationStep | null;
  afterPlayer?: PlayerState | null;
}) {
  return (
    <div
      className="mvp-board"
      role="group"
      aria-label={`Player ${player.id} battlefield`}
    >
      {boardPositions.map((position) => {
        const character = player.board[position];
        const isLegalTarget =
          kind === 'enemy' && legalTargets.includes(position);
        const isSelected = selected === position;
        const striking =
          combatStep?.kind === 'strike' &&
          combatStep.source === kind &&
          combatStep.sourcePosition === position;
        const impacted =
          combatStep?.kind === 'strike' &&
          combatStep.target === kind &&
          combatStep.targetPosition === position;
        const damage =
          combatStep?.kind === 'damage' &&
          combatStep.target === kind &&
          combatStep.position === position
            ? combatStep
            : null;
        const ko =
          combatStep?.kind === 'ko' &&
          combatStep.target === kind &&
          combatStep.position === position;
        const actionStep =
          combatStep?.kind === 'action' && combatStep.side === kind
            ? combatStep.action
            : null;
        const from =
          actionStep &&
          'fromPosition' in actionStep &&
          actionStep.fromPosition === position;
        const to =
          actionStep &&
          'toPosition' in actionStep &&
          actionStep.toPosition === position;
        const focus =
          actionStep &&
          'position' in actionStep &&
          actionStep.position === position;
        const arriving =
          actionStep?.kind === 'deploy' && focus
            ? afterPlayer?.board[position]
            : null;
        const shownCharacter = character ?? arriving;
        return (
          <button
            type="button"
            className={[
              'mvp-slot',
              isSelected &&
                kind === 'friendly' &&
                character &&
                'is-attacker-selected',
              isSelected &&
                kind === 'friendly' &&
                !character &&
                'is-slot-selected',
              isLegalTarget && 'is-valid-target',
              handTargets.includes(position) && 'is-hand-target',
              hovered === position &&
                (handTargets.includes(position) || isLegalTarget) &&
                'is-drop-hovered',
              hovered === position &&
                !handTargets.includes(position) &&
                !isLegalTarget &&
                'is-invalid-drop',
              character?.exhausted && 'is-exhausted',
              dragSource === position && 'is-drag-source',
              isSelected && kind === 'enemy' && 'is-target-selected',
              striking &&
                (kind === 'friendly' ? 'is-striking-up' : 'is-striking-down'),
              impacted && 'is-combat-impacted',
              ko && 'is-combat-ko',
              from &&
                (actionStep.toPosition > position
                  ? 'is-action-moving-right'
                  : 'is-action-moving-left'),
              to &&
                actionStep.kind === 'swap' &&
                (actionStep.fromPosition > position
                  ? 'is-action-moving-right'
                  : 'is-action-moving-left'),
              to && actionStep.kind === 'move' && 'is-action-destination',
              focus && actionStep.kind === 'deploy' && 'is-action-deploy',
              focus &&
                (actionStep.kind === 'equip' || actionStep.kind === 'event') &&
                'is-action-focus',
              focus &&
                actionStep.kind === 'event' &&
                actionStep.event === 'retreat' &&
                'is-action-retreat',
            ]
              .filter(Boolean)
              .join(' ')}
            key={position}
            onClick={() => onSelect(position)}
            onPointerDown={
              kind === 'friendly' && character
                ? (event) => onPointerStart?.(position, event)
                : undefined
            }
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerCancel}
            data-mvp-drop-side={kind}
            data-mvp-drop-position={position}
            aria-pressed={isSelected}
            aria-label={`Player ${player.id} slot ${position}: ${character ? `${nameOf(character)}, HP ${character.currentHp}/10, ${character.weapon}${character.exhausted ? ', Exhausted' : ''}${character.newlyDeployed ? ', Newly deployed' : ''}` : 'empty'}`}
          >
            {shownCharacter ? (
              <>
                <div className="mvp-board-card" aria-hidden="true">
                  <GameplayCardFace card={shownCharacter} initialWidth={112} />
                </div>
                <span className="mvp-board-card-hud" aria-hidden="true">
                  <strong>{nameOf(shownCharacter)}</strong>
                  <span>
                    HP {shownCharacter.currentHp}/10 · {shownCharacter.weapon}
                  </span>
                </span>
                <span className="mvp-flags">
                  {shownCharacter.newlyDeployed && <small>New</small>}
                  {shownCharacter.exhausted && <small>Exhausted</small>}
                  {shownCharacter.temporaryItemEquipped && (
                    <small>Item: this round</small>
                  )}
                  {shownCharacter.rally && <small>Rally</small>}
                  {shownCharacter.defensiveStance && <small>Stance</small>}
                </span>
              </>
            ) : (
              <span className="mvp-empty">Empty</span>
            )}
            {damage && (
              <span
                className={`mvp-damage-popup ${damage.advantage ? 'is-advantage' : ''}`}
                aria-label={`${damage.damage} damage`}
              >
                {damagePopupLabel(damage.damage)}
              </span>
            )}
            {ko && <span className="mvp-ko-popup">KO</span>}
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
  const [setupOpen, setSetupOpen] = useState(true);
  const [starting, setStarting] = useState(initialChoices);
  const [ownPosition, setOwnPosition] = useState<BattlefieldPosition | null>(
    null,
  );
  const [targetPosition, setTargetPosition] =
    useState<BattlefieldPosition | null>(null);
  const [combatPreview, setCombatPreview] = useState<CombatPreview | null>(
    null,
  );
  const [combatAnimation, setCombatAnimation] =
    useState<CombatAnimationSession | null>(null);
  const combatLockRef = useRef(false);
  const cancelPreviewRef = useRef<HTMLButtonElement>(null);
  const [handId, setHandId] = useState('');
  const [inspected, setInspected] = useState<{
    playerId: PlayerId;
    instanceId: string;
  } | null>(null);
  const [dragSource, setDragSource] = useState<DragSource | null>(null);
  const [hoverTarget, setHoverTarget] = useState<DropTarget | null>(null);
  const [dragVisual, setDragVisual] = useState<{
    label: string;
    image?: string;
    x: number;
    y: number;
  } | null>(null);
  const dragGhostRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<{
    pointerId: number;
    source: DragSource;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const snapTimerRef = useRef<number | null>(null);
  const [message, setMessage] = useState(
    'Select a character, then choose an action.',
  );

  const displayedMatch = combatAnimation?.before ?? match;
  const combatStep = combatAnimation?.steps[combatAnimation.index] ?? null;
  const animationLabel =
    combatStep?.kind === 'draw'
      ? `Player ${combatStep.playerId} draws a card`
      : combatAnimation?.label;
  const { friendly: active, enemy: opponent } = visiblePlayers(
    displayedMatch,
    mode,
  );
  const inspectedCard = inspected
    ? visibleCardInstance(
        displayedMatch,
        mode,
        inspected.playerId,
        inspected.instanceId,
      )
    : null;
  const selected = ownPosition === null ? null : active.board[ownPosition];
  const selectedHand = active.hand.find((entry) => entry.instanceId === handId);
  const botTurn =
    mode === 'bot' && match.activePlayerId === 'two' && !match.winner;
  const selectedSource: DragSource | null =
    dragSource ??
    (selectedHand
      ? { kind: 'hand', instanceId: selectedHand.instanceId }
      : selected
        ? {
            kind: 'board',
            position: ownPosition!,
            instanceId: selected.instanceId,
          }
        : null);
  const legalDrops =
    setupOpen || botTurn || combatAnimation || !selectedSource
      ? []
      : legalDropTargets(match, selectedSource);
  const handTargets = legalDrops
    .filter((target) => target.side === 'friendly')
    .map((target) => target.position);
  const legalTargets =
    botTurn || combatAnimation
      ? []
      : dragSource?.kind === 'board'
        ? legalDrops
            .filter((target) => target.side === 'enemy')
            .map((target) => target.position)
        : legalAttackTargets(match, ownPosition);
  const selectedTarget =
    targetPosition !== null && legalTargets.includes(targetPosition)
      ? targetPosition
      : null;
  const visiblePreview =
    !combatAnimation &&
    combatPreview?.stateAtPreview === match &&
    combatPreview.action.attackerPosition === ownPosition &&
    combatPreview.action.targetPosition === selectedTarget
      ? combatPreview
      : null;

  useEffect(() => {
    if (visiblePreview) cancelPreviewRef.current?.focus();
  }, [visiblePreview]);

  useEffect(
    () => () => {
      if (snapTimerRef.current !== null)
        window.clearTimeout(snapTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!combatAnimation) return;
    const step = combatAnimation.steps[combatAnimation.index];
    const timer = window.setTimeout(() => {
      if (combatAnimation.index + 1 === combatAnimation.steps.length) {
        combatLockRef.current = false;
        setCombatAnimation(null);
        return;
      }
      setCombatAnimation((current) => {
        if (!current) return null;
        return { ...current, index: current.index + 1 };
      });
    }, step.durationMs);
    return () => window.clearTimeout(timer);
  }, [combatAnimation]);

  function commitAttack(preview: CombatPreview, bot = false) {
    if (combatLockRef.current) return;
    const session = beginCombatAnimation(
      match,
      preview,
      combatLockRef.current,
      bot && mode === 'bot' ? 'enemy' : 'friendly',
    );
    const next = session.after;
    combatLockRef.current = true;
    setMatch(next);
    setCombatAnimation({
      ...session,
      label: `${bot ? 'Bot · ' : ''}${nameOf(preview.attacker)} attacks ${nameOf(preview.defender)}`,
    });
    setOwnPosition(null);
    setTargetPosition(null);
    setCombatPreview(null);
    setHandId('');
    setMessage(
      `${bot ? 'Bot: ' : ''}${next.log.slice(match.log.length).join(' ')}`,
    );
  }

  function commitOtherAction(
    action: Exclude<MatchAction, { kind: 'attack' }>,
    bot = false,
  ) {
    if (combatLockRef.current) return;
    const session = beginActionAnimation(
      match,
      action,
      combatLockRef.current,
      bot && mode === 'bot' ? 'enemy' : 'friendly',
    );
    combatLockRef.current = true;
    setMatch(session.after);
    setCombatAnimation({
      ...session,
      label: `${bot ? 'Bot · ' : ''}${session.label}`,
    });
    setOwnPosition(null);
    setTargetPosition(null);
    setCombatPreview(null);
    setHandId('');
    setMessage(
      `${bot ? 'Bot: ' : ''}${session.after.log.slice(match.log.length).join(' ')}`,
    );
  }

  useEffect(() => {
    if (
      setupOpen ||
      combatAnimation ||
      combatLockRef.current ||
      mode !== 'bot' ||
      match.activePlayerId !== 'two' ||
      match.winner
    )
      return;
    const timer = window.setTimeout(() => {
      const action = chooseBotAction(match, 'two');
      if (!action || combatLockRef.current) return;
      try {
        if (action.kind === 'attack') {
          commitAttack(previewMatchAttack(match, action), true);
          return;
        }
        commitOtherAction(action, true);
      } catch (error) {
        setMessage(
          error instanceof Error ? `Bot error: ${error.message}` : 'Bot error',
        );
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [match, mode, setupOpen, combatAnimation]);

  function run(action: MatchAction): boolean {
    if (botTurn || combatLockRef.current) return false;
    try {
      if (action.kind === 'attack') return false;
      commitOtherAction(action);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action unavailable');
      return false;
    }
  }

  function openCombatPreview(
    attacker: BattlefieldPosition,
    target: BattlefieldPosition,
  ): boolean {
    if (botTurn || match.winner || combatLockRef.current) return false;
    try {
      const preview = previewMatchAttack(match, {
        kind: 'attack',
        attackerPosition: attacker,
        targetPosition: target,
      });
      setOwnPosition(attacker);
      setHandId('');
      setTargetPosition(target);
      setCombatPreview(preview);
      return true;
    } catch (error) {
      setTargetPosition(null);
      setCombatPreview(null);
      setMessage(error instanceof Error ? error.message : 'Attack unavailable');
      return false;
    }
  }

  function attemptDrop(source: DragSource, target: DropTarget): boolean {
    if (botTurn || match.winner || combatLockRef.current) return false;
    const action = actionForDrop(match, source, target);
    if (!action) return false;
    return action.kind === 'attack'
      ? openCombatPreview(action.attackerPosition, action.targetPosition)
      : run(action);
  }

  function targetAt(x: number, y: number): DropTarget | null {
    const element = document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>('[data-mvp-drop-side]');
    const side = element?.dataset.mvpDropSide;
    const position = Number(element?.dataset.mvpDropPosition);
    if (
      (side !== 'friendly' && side !== 'enemy') ||
      !boardPositions.includes(position as BattlefieldPosition)
    )
      return null;
    return { side, position: position as BattlefieldPosition };
  }

  function startDrag(
    source: DragSource,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    if (botTurn || match.winner || combatLockRef.current || event.button !== 0)
      return;
    if (snapTimerRef.current !== null)
      window.clearTimeout(snapTimerRef.current);
    dragGhostRef.current?.classList.remove('is-returning');
    const card =
      source.kind === 'hand'
        ? active.hand.find((entry) => entry.instanceId === source.instanceId)
        : active.board[source.position];
    if (!card) return;
    const image = isCombatant(card)
      ? heroCards.find((hero) => hero.id === card.cardId)?.image
      : undefined;
    gestureRef.current = {
      pointerId: event.pointerId,
      source,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragSource(source);
    setHoverTarget(null);
    setDragVisual({
      label: handLabel(card),
      image,
      x: event.clientX,
      y: event.clientY,
    });
  }

  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (
      !gesture.moved &&
      Math.hypot(
        event.clientX - gesture.startX,
        event.clientY - gesture.startY,
      ) < 7
    )
      return;
    gesture.moved = true;
    event.preventDefault();
    if (dragGhostRef.current) {
      dragGhostRef.current.style.left = `${event.clientX}px`;
      dragGhostRef.current.style.top = `${event.clientY}px`;
    }
    const target = targetAt(event.clientX, event.clientY);
    setHoverTarget((previous) =>
      previous?.side === target?.side && previous?.position === target?.position
        ? previous
        : target,
    );
  }

  function endDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    setDragSource(null);
    setHoverTarget(null);
    if (!gesture.moved) {
      setDragVisual(null);
      return;
    }
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
    const target = targetAt(event.clientX, event.clientY);
    const accepted = target ? attemptDrop(gesture.source, target) : false;
    if (accepted) {
      setDragVisual(null);
      return;
    }
    setMessage('Invalid drop. No action was spent.');
    if (dragGhostRef.current) {
      dragGhostRef.current.classList.add('is-returning');
      dragGhostRef.current.style.left = `${gesture.startX}px`;
      dragGhostRef.current.style.top = `${gesture.startY}px`;
    }
    snapTimerRef.current = window.setTimeout(() => setDragVisual(null), 180);
  }

  function cancelDrag() {
    gestureRef.current = null;
    setDragSource(null);
    setHoverTarget(null);
    setDragVisual(null);
  }

  function selectFriendly(position: BattlefieldPosition) {
    const inspectedUnit = active.board[position];
    if (inspectedUnit && !combatLockRef.current)
      setInspected({
        playerId: active.id,
        instanceId: inspectedUnit.instanceId,
      });
    if (
      botTurn ||
      match.winner ||
      combatLockRef.current ||
      suppressClickRef.current
    )
      return;
    if (selectedHand) {
      attemptDrop(
        { kind: 'hand', instanceId: selectedHand.instanceId },
        { side: 'friendly', position },
      );
      return;
    }
    if (selected && ownPosition !== null && ownPosition !== position) {
      const source = {
        kind: 'board',
        position: ownPosition,
        instanceId: selected.instanceId,
      } as const;
      const target = { side: 'friendly', position } as const;
      const action = actionForDrop(match, source, target);
      if (action) {
        try {
          applyMatchAction(match, action);
          run(action);
          return;
        } catch {
          /* Select the other character instead. */
        }
      }
    }
    setOwnPosition(position);
    setTargetPosition(null);
    setCombatPreview(null);
  }

  function cancelCombatPreview() {
    setCombatPreview(null);
    setTargetPosition(null);
  }

  function confirmCombatPreview() {
    if (!combatPreview || combatLockRef.current) return;
    try {
      commitAttack(combatPreview);
    } catch (error) {
      cancelCombatPreview();
      setMessage(error instanceof Error ? error.message : 'Attack unavailable');
    }
  }

  function reset() {
    combatLockRef.current = false;
    setCombatAnimation(null);
    setSetupOpen(true);
    setOwnPosition(null);
    setTargetPosition(null);
    setCombatPreview(null);
    setHandId('');
    setInspected(null);
    cancelDrag();
    setMessage('Choose two starting units and positions for each player.');
  }

  function startMatch() {
    combatLockRef.current = false;
    setCombatAnimation(null);
    try {
      const next = createStarterMatch(firstPlayerId, [
        starting.one,
        starting.two,
      ]);
      setMatch(next);
      setSetupOpen(false);
      setOwnPosition(null);
      setTargetPosition(null);
      setCombatPreview(null);
      setHandId('');
      setInspected(null);
      cancelDrag();
      setMessage(
        'Starter match started. Select a card in hand or a unit on the board.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Invalid starting units',
      );
    }
  }

  function updateStarting(
    playerId: PlayerId,
    index: 0 | 1,
    update: Partial<SetupChoice>,
  ) {
    setStarting((previous) => {
      const choices = [...previous[playerId]] as [SetupChoice, SetupChoice];
      choices[index] = { ...choices[index], ...update };
      return { ...previous, [playerId]: choices };
    });
  }

  if (setupOpen)
    return (
      <section className="mvp-sandbox">
        <div className="eyebrow">DEVELOPMENT · GAMEPLAY MVP VER.1</div>
        <h1>Gameplay Sandbox</h1>
        <p>
          Each player has the same 20-card starter: 6 unique heroes, 8 Items and
          6 Events. Select two starting units and their slots.
        </p>
        <div className="mvp-setup">
          <label>
            Opponent
            <select
              value={mode}
              onChange={(event) =>
                setMode(event.target.value as 'bot' | 'local')
              }
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
        </div>
        <div className="mvp-starting-grid">
          {(['one', 'two'] as const).map((playerId) => (
            <div className="mvp-starting-player" key={playerId}>
              <h2>
                Player {playerId}
                {mode === 'bot' && playerId === 'two' ? ' · Bot' : ''}
              </h2>
              {([0, 1] as const).map((index) => (
                <div className="mvp-starting-choice" key={index}>
                  <label>
                    Starting unit {index + 1}
                    <select
                      value={starting[playerId][index].instanceId}
                      onChange={(event) =>
                        updateStarting(playerId, index, {
                          instanceId: event.target.value,
                        })
                      }
                    >
                      {starterCharacterCards(playerId).map((entry) => {
                        const card = heroCards.find(
                          (hero) => hero.id === entry.cardId,
                        );
                        return (
                          <option
                            key={entry.instanceId}
                            value={entry.instanceId}
                          >
                            {card?.name ?? entry.cardId}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                  <label>
                    Slot
                    <select
                      value={starting[playerId][index].position}
                      onChange={(event) =>
                        updateStarting(playerId, index, {
                          position: Number(
                            event.target.value,
                          ) as BattlefieldPosition,
                        })
                      }
                    >
                      {boardPositions.map((position) => (
                        <option key={position} value={position}>
                          {position}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}
            </div>
          ))}
        </div>
        <button className="primary" type="button" onClick={startMatch}>
          Start match
        </button>
        <p role="status">{message}</p>
      </section>
    );

  return (
    <section
      className="mvp-sandbox"
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        cancelDrag();
        setHandId('');
        setOwnPosition(null);
        setTargetPosition(null);
        setCombatPreview(null);
        setInspected(null);
      }}
    >
      <div className="eyebrow">DEVELOPMENT · GAMEPLAY MVP VER.1</div>
      <div className="mvp-heading">
        <div>
          <h1>Gameplay Sandbox</h1>
          <p>
            Drag cards to legal targets, or select a card and click its target.
            Press Escape to clear a selection. Player two can be a test bot.
          </p>
        </div>
        <div className="mvp-setup">
          <label>
            Opponent
            <select
              value={mode}
              onChange={(event) => {
                setMode(event.target.value as 'bot' | 'local');
                reset();
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
        {displayedMatch.players.map((player) => (
          <div
            key={player.id}
            className={
              displayedMatch.activePlayerId === player.id ? 'is-active' : ''
            }
          >
            <strong>
              Player {player.id}
              {mode === 'bot' && player.id === 'two' ? ' · Bot' : ''}
            </strong>
            <span>{player.kos}/5 KOs</span>
          </div>
        ))}
        <div className="mvp-turn">
          Turn {displayedMatch.turn} ·{' '}
          {displayedMatch.winner
            ? `Player ${displayedMatch.winner} wins`
            : combatAnimation
              ? 'Resolving combat…'
              : botTurn
                ? 'Bot is choosing an action…'
                : `Player ${displayedMatch.activePlayerId} to act`}
        </div>
      </div>
      <div className="mvp-play-area">
        <div className="mvp-battlefield">
          <div className="mvp-side-label">OPPONENT · PLAYER {opponent.id}</div>
          <div
            className={`mvp-field-row is-enemy ${displayedMatch.activePlayerId === opponent.id ? 'is-turn-active' : ''}`}
          >
            <GameplayPiles player={opponent} />
            <Board
              player={opponent}
              kind="enemy"
              combatStep={combatStep}
              afterPlayer={combatAnimation?.after.players.find(
                (player) => player.id === opponent.id,
              )}
              selected={selectedTarget}
              legalTargets={legalTargets}
              hovered={
                hoverTarget?.side === 'enemy' ? hoverTarget.position : null
              }
              onSelect={(position) => {
                const character = opponent.board[position];
                if (character && !combatLockRef.current)
                  setInspected({
                    playerId: opponent.id,
                    instanceId: character.instanceId,
                  });
                if (
                  suppressClickRef.current ||
                  botTurn ||
                  combatLockRef.current ||
                  match.winner ||
                  ownPosition === null
                )
                  return;
                openCombatPreview(ownPosition, position);
              }}
            />
            {combatStep?.kind === 'draw' && combatStep.side === 'enemy' && (
              <div className="mvp-draw-flight" aria-hidden="true">
                <CardBack interactive={false} />
              </div>
            )}
          </div>
          <div className="mvp-divider">VS</div>
          <div className="mvp-side-label">
            {mode === 'bot' ? 'YOUR FIELD' : 'ACTIVE'} · PLAYER {active.id}
          </div>
          <div
            className={`mvp-field-row is-friendly ${displayedMatch.activePlayerId === active.id ? 'is-turn-active' : ''}`}
          >
            <GameplayPiles player={active} />
            <Board
              player={active}
              kind="friendly"
              combatStep={combatStep}
              afterPlayer={combatAnimation?.after.players.find(
                (player) => player.id === active.id,
              )}
              selected={ownPosition}
              handTargets={handTargets}
              hovered={
                hoverTarget?.side === 'friendly' ? hoverTarget.position : null
              }
              dragSource={
                dragSource?.kind === 'board' ? dragSource.position : null
              }
              onSelect={selectFriendly}
              onPointerStart={(position, event) => {
                const character = active.board[position];
                if (character)
                  startDrag(
                    {
                      kind: 'board',
                      position,
                      instanceId: character.instanceId,
                    },
                    event,
                  );
              }}
              onPointerMove={moveDrag}
              onPointerEnd={endDrag}
              onPointerCancel={cancelDrag}
            />
            {combatStep?.kind === 'draw' && combatStep.side === 'friendly' && (
              <div className="mvp-draw-flight" aria-hidden="true">
                <CardBack interactive={false} />
              </div>
            )}
          </div>
          {animationLabel && (
            <div className="mvp-action-cue" role="status">
              {animationLabel}
            </div>
          )}
          {combatAnimation && (
            <button
              className="mvp-skip-animation secondary"
              type="button"
              onClick={() => {
                combatLockRef.current = false;
                setCombatAnimation(null);
              }}
            >
              Skip animation
            </button>
          )}
        </div>
        <CardInspectionPanel
          card={inspectedCard}
          onClose={() => setInspected(null)}
        />
      </div>
      {visiblePreview && (
        <section
          className="mvp-combat-preview"
          role="region"
          aria-label="Combat Preview"
          onKeyDown={(event) => {
            if (event.key === 'Escape') cancelCombatPreview();
          }}
        >
          <div className="mvp-preview-heading">
            <h2>Combat Preview</h2>
            <span>1 Main Action on confirmation</span>
          </div>
          <div className="mvp-preview-sides">
            <div className="mvp-preview-side">
              <span>Attacker · {visiblePreview.attacker.weapon}</span>
              <strong>{nameOf(visiblePreview.attacker)}</strong>
              <p>
                HP {visiblePreview.attacker.currentHp} →{' '}
                <b>{visiblePreview.attackerHpAfter}</b>
                {visiblePreview.attackerHpAfter === 0 && (
                  <em className="mvp-preview-ko"> KO</em>
                )}
              </p>
              <p>Attack damage: {visiblePreview.attackDamage}</p>
            </div>
            <div className="mvp-preview-side">
              <span>Defender · {visiblePreview.defender.weapon}</span>
              <strong>{nameOf(visiblePreview.defender)}</strong>
              <p>
                HP {visiblePreview.defender.currentHp} →{' '}
                <b>{visiblePreview.defenderHpAfter}</b>
                {visiblePreview.defenderHpAfter === 0 && (
                  <em className="mvp-preview-ko"> KO</em>
                )}
              </p>
              <p>
                {visiblePreview.counterattackPossible
                  ? `Counterattack damage: ${visiblePreview.counterattackDamage}`
                  : 'No counterattack'}
              </p>
            </div>
          </div>
          <div className="mvp-preview-details">
            <span>
              Weapon Triangle:{' '}
              <b className={`is-${visiblePreview.triangle}`}>
                {visiblePreview.triangle}
              </b>
            </span>
            {visiblePreview.attacker.rally && (
              <span>
                Rally Strength: +1 attack damage (cap {match.rallyDamageCap})
              </span>
            )}
            {visiblePreview.defender.defensiveStance && (
              <span>Defender's Defensive Stance: −1 incoming damage</span>
            )}
            {visiblePreview.attacker.defensiveStance &&
              visiblePreview.counterattackPossible && (
                <span>Attacker's Defensive Stance: −1 counter damage</span>
              )}
          </div>
          <div className="mvp-preview-actions">
            <button
              ref={cancelPreviewRef}
              className="secondary"
              type="button"
              onClick={cancelCombatPreview}
            >
              Cancel
            </button>
            <button
              className="primary"
              type="button"
              onClick={confirmCombatPreview}
            >
              Confirm Attack
            </button>
          </div>
        </section>
      )}
      <section
        className="mvp-hand"
        aria-label={mode === 'bot' ? 'Your hand' : "Current player's hand"}
      >
        <div className="mvp-hand-heading">
          <h2>
            Player {active.id} hand · {active.hand.length} cards
          </h2>
          <span>Drag to play · Click to inspect and select</span>
        </div>
        <div className="mvp-hand-cards">
          {active.hand.map((card) => {
            return (
              <button
                type="button"
                key={card.instanceId}
                className={`mvp-hand-card ${handId === card.instanceId ? 'is-selected' : ''} ${dragSource?.kind === 'hand' && dragSource.instanceId === card.instanceId ? 'is-drag-source' : ''} ${combatStep?.kind === 'action' && 'handId' in combatStep.action && combatStep.action.handId === card.instanceId ? 'is-playing' : ''}`}
                disabled={
                  botTurn || Boolean(match.winner) || Boolean(combatAnimation)
                }
                aria-pressed={handId === card.instanceId}
                aria-label={handLabel(card)}
                data-drag-source={card.instanceId}
                onPointerDown={(event) =>
                  startDrag(
                    { kind: 'hand', instanceId: card.instanceId },
                    event,
                  )
                }
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={cancelDrag}
                onClick={() => {
                  if (suppressClickRef.current || combatLockRef.current) return;
                  setHandId(card.instanceId);
                  setOwnPosition(null);
                  setTargetPosition(null);
                  setCombatPreview(null);
                  setInspected({
                    playerId: active.id,
                    instanceId: card.instanceId,
                  });
                }}
              >
                <div className="mvp-hand-print" aria-hidden="true">
                  <GameplayCardFace card={card} initialWidth={100} />
                </div>
                <span className="mvp-hand-label">{handLabel(card)}</span>
              </button>
            );
          })}
        </div>
      </section>
      <div className="mvp-action-bar">
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
          <span>
            Event <b>{active.eventUsedThisTurn ? 'Used' : 'Available'}</b>
          </span>
        </div>
        <button
          className="primary"
          type="button"
          disabled={
            Boolean(match.winner) || botTurn || Boolean(combatAnimation)
          }
          onClick={() => run({ kind: 'end-turn' })}
        >
          End Turn
        </button>
      </div>
      <p className="mvp-message" role="status">
        {message}
      </p>
      <details className="mvp-match-log">
        <summary>Match log</summary>
        <ol className="mvp-log">
          {match.log.slice(-12).map((entry, index) => (
            <li key={`${match.log.length - 12 + index}-${entry}`}>{entry}</li>
          ))}
        </ol>
      </details>
      {dragVisual && (
        <div
          ref={dragGhostRef}
          className="mvp-drag-ghost"
          style={{ left: dragVisual.x, top: dragVisual.y }}
          aria-hidden="true"
        >
          {dragVisual.image && <img src={dragVisual.image} alt="" />}
          <strong>{dragVisual.label}</strong>
        </div>
      )}{' '}
    </section>
  );
}
