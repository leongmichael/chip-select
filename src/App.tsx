import { useMemo, useState } from "react";

type GameMode = "cash" | "tournament";
type StackMode = "money" | "bigBlinds";

type ChipColor = {
  id: string;
  name: string;
  count: number;
  swatch: string;
};

type ChipRecommendation = ChipColor & {
  value: number;
  totalValue: number;
  perPlayer: number;
};

const DEFAULT_CHIPS: ChipColor[] = [
  { id: "red", name: "Red", count: 200, swatch: "#ef4444" },
  { id: "black", name: "Black", count: 400, swatch: "#171717" },
  { id: "green", name: "Green", count: 400, swatch: "#22c55e" },
  { id: "white", name: "White", count: 400, swatch: "#f8fafc" },
];

const NEW_CHIP_COLORS = ["#3b82f6", "#a855f7", "#f97316", "#14b8a6", "#eab308"];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value >= 10 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const numberFormat = new Intl.NumberFormat("en-US");

function buildDenominations(
  smallBlind: number,
  bigBlind: number,
  chipCount: number,
  totalBankNeeded: number,
  chips: ChipColor[],
) {
  if (chipCount === 0) {
    return [];
  }

  const baseUnit = smallBlind > 0 ? smallBlind : Math.max(bigBlind / 2, 0.01);
  const baseDenoms = [
    baseUnit,
    bigBlind * 2,
    bigBlind * 10,
    bigBlind * 50,
    bigBlind * 100,
    bigBlind * 500,
    bigBlind * 1000,
  ]
    .map(roundMoney)
    .filter((value, index, values) => value > 0 && values.indexOf(value) === index);

  const denominations = baseDenoms.slice(0, chipCount);

  while (denominations.length < chipCount) {
    const last = denominations[denominations.length - 1] ?? baseUnit;
    denominations.push(roundMoney(last * 5));
  }

  while (
    chips.reduce((sum, chip, index) => sum + chip.count * denominations[index], 0) <
    totalBankNeeded
  ) {
    denominations[denominations.length - 1] = roundMoney(
      denominations[denominations.length - 1] * 2,
    );
  }

  return denominations;
}

function calculatePerPlayerChips(
  recommendations: ChipRecommendation[],
  buyIn: number,
  players: number,
) {
  if (players <= 0 || buyIn <= 0) {
    return recommendations.map(() => 0);
  }

  const counts = recommendations.map(() => 0);
  let remaining = buyIn;

  recommendations.slice(0, -1).forEach((chip, index) => {
    const perPlayerAvailable = Math.floor(chip.count / players);
    const target =
      index === 0
        ? clamp(Math.round(4 / chip.value), 8, 20)
        : clamp(Math.round(12 / chip.value), 4, 16);
    const affordable = Math.floor((remaining * 0.35) / chip.value);
    const amount = clamp(Math.min(target, affordable, perPlayerAvailable), 0, perPlayerAvailable);

    counts[index] = amount;
    remaining = roundMoney(remaining - amount * chip.value);
  });

  for (let index = recommendations.length - 1; index >= 0; index -= 1) {
    const chip = recommendations[index];
    const available = Math.max(0, Math.floor(chip.count / players) - counts[index]);
    const amount = Math.min(available, Math.floor((remaining + 0.001) / chip.value));

    counts[index] += amount;
    remaining = roundMoney(remaining - amount * chip.value);
  }

  if (remaining > 0 && recommendations.length > 0) {
    const lowest = recommendations[0];
    const extra = Math.min(
      Math.ceil(remaining / lowest.value),
      Math.max(0, Math.floor(lowest.count / players) - counts[0]),
    );

    counts[0] += extra;
  }

  return counts;
}

function NumberInput({
  label,
  value,
  min = 0,
  step = 1,
  onChange,
  prefix,
  helper,
  placeholder,
}: {
  label: string;
  value: number;
  min?: number;
  step?: number;
  onChange: (value: number) => void;
  prefix?: string;
  helper?: string;
  placeholder?: string;
}) {
  return (
    <label className="field">
      {label ? <span>{label}</span> : null}
      <div className="input-shell">
        {prefix ? <span className="prefix">{prefix}</span> : null}
        <input
          type="number"
          min={min}
          step={step}
          value={value === 0 ? "" : value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value === "" ? 0 : Number(event.target.value))}
        />
      </div>
      {helper ? <small>{helper}</small> : null}
    </label>
  );
}

export default function App() {
  const [mode, setMode] = useState<GameMode>("cash");
  const [stackMode, setStackMode] = useState<StackMode>("money");
  const [stackMoney, setStackMoney] = useState(50);
  const [stackBigBlinds, setStackBigBlinds] = useState(100);
  const [smallBlind, setSmallBlind] = useState(0.25);
  const [bigBlind, setBigBlind] = useState(0.5);
  const [players, setPlayers] = useState(5);
  const [rebuys, setRebuys] = useState(0);
  const [chips, setChips] = useState<ChipColor[]>(DEFAULT_CHIPS);

  const activeChips = chips.filter((chip) => chip.count > 0 && chip.name.trim().length > 0);
  const buyIn = roundMoney(stackMode === "money" ? stackMoney : stackBigBlinds * bigBlind);
  const totalBuyIns = Math.max(0, players * (1 + rebuys));
  const totalBankNeeded = roundMoney(buyIn * totalBuyIns);

  const recommendations = useMemo<ChipRecommendation[]>(() => {
    const denominations = buildDenominations(
      smallBlind,
      bigBlind,
      activeChips.length,
      totalBankNeeded,
      activeChips,
    );

    const baseRecommendations = activeChips.map((chip, index) => ({
      ...chip,
      value: denominations[index],
      totalValue: roundMoney(chip.count * denominations[index]),
      perPlayer: 0,
    }));

    const perPlayerCounts = calculatePerPlayerChips(baseRecommendations, buyIn, players);

    return baseRecommendations.map((chip, index) => ({
      ...chip,
      perPlayer: perPlayerCounts[index] ?? 0,
    }));
  }, [activeChips, bigBlind, buyIn, players, smallBlind, totalBankNeeded]);

  const bankValue = recommendations.reduce((sum, chip) => sum + chip.totalValue, 0);
  const sampleStackValue = recommendations.reduce(
    (sum, chip) => sum + chip.perPlayer * chip.value,
    0,
  );
  const totalChipsInPlay = recommendations.reduce(
    (sum, chip) => sum + chip.perPlayer * players,
    0,
  );
  const bankIsShort = bankValue < totalBankNeeded;

  const updateChip = (id: string, updates: Partial<Omit<ChipColor, "id">>) => {
    setChips((current) =>
      current.map((chip) =>
        chip.id === id
          ? {
              ...chip,
              ...updates,
              count:
                updates.count === undefined
                  ? chip.count
                  : Math.max(0, Math.floor(updates.count || 0)),
            }
          : chip,
      ),
    );
  };

  const addChip = () => {
    setChips((current) => {
      const nextNumber = current.length + 1;
      const swatch = NEW_CHIP_COLORS[current.length % NEW_CHIP_COLORS.length];

      return [
        ...current,
        {
          id: crypto.randomUUID(),
          name: `Color ${nextNumber}`,
          count: 0,
          swatch,
        },
      ];
    });
  };

  const removeChip = (id: string) => {
    setChips((current) => current.filter((chip) => chip.id !== id));
  };

  const changeStackMode = (nextMode: StackMode) => {
    if (nextMode === stackMode) {
      return;
    }

    if (nextMode === "bigBlinds") {
      setStackBigBlinds(bigBlind > 0 ? Math.round(stackMoney / bigBlind) : 0);
    } else {
      setStackMoney(roundMoney(stackBigBlinds * bigBlind));
    }

    setStackMode(nextMode);
  };

  const modeCard = (
    <div className="mode-card" aria-label="Game mode">
      <button
        className={mode === "cash" ? "active" : ""}
        type="button"
        onClick={() => setMode("cash")}
      >
        Cash game
      </button>
      <button
        className={mode === "tournament" ? "active" : ""}
        type="button"
        onClick={() => setMode("tournament")}
      >
        Tournament
        <span>Coming soon</span>
      </button>
    </div>
  );

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="app-title">Chip Select</p>
          <div className="hero-message">
            <h1>Pick chip values that fit your game and your case.</h1>
          </div>
        </div>
      </section>

      {mode === "tournament" ? (
        <>
          <div className="standalone-mode">{modeCard}</div>
          <section className="placeholder-card">
            <p className="eyebrow">Coming soon</p>
            <h2>Tournament setup is on the roadmap.</h2>
            <p>
              This mode will eventually help choose tournament denominations, starting stacks, blind
              schedules, and color-up points. Cash-game planning is available now.
            </p>
          </section>
        </>
      ) : (
        <section className="workspace">
          <div className="panel controls">
            <div className="panel-heading">
              <p className="eyebrow">Cash inputs</p>
              <h2>Game details</h2>
            </div>

            <div className="input-grid">
              <div className="stack-control">
                <div className="stack-control-top">
                  <span>Starting stack</span>
                </div>

                <div className="stack-input-row">
                  {stackMode === "money" ? (
                    <NumberInput
                      label=""
                      value={stackMoney}
                      min={1}
                      step={5}
                      prefix="$"
                      helper={`${numberFormat.format(
                        Math.round(stackMoney / Math.max(bigBlind, 0.01)),
                      )} big blinds at the current big blind.`}
                      onChange={setStackMoney}
                    />
                  ) : (
                    <NumberInput
                      label=""
                      value={stackBigBlinds}
                      min={1}
                      step={5}
                      helper={`${money(buyIn)} per player at the current big blind.`}
                      onChange={setStackBigBlinds}
                    />
                  )}

                  <div className="stack-toggle" aria-label="Starting stack input mode">
                    <button
                      className={stackMode === "money" ? "active" : ""}
                      type="button"
                      onClick={() => changeStackMode("money")}
                    >
                      Money
                    </button>
                    <button
                      className={stackMode === "bigBlinds" ? "active" : ""}
                      type="button"
                      onClick={() => changeStackMode("bigBlinds")}
                    >
                      Big blinds
                    </button>
                  </div>
                </div>
              </div>
              <NumberInput
                label="Small blind"
                value={smallBlind}
                min={0.01}
                step={0.25}
                prefix="$"
                onChange={setSmallBlind}
              />
              <NumberInput
                label="Big blind"
                value={bigBlind}
                min={0.01}
                step={0.25}
                prefix="$"
                onChange={setBigBlind}
              />
              <NumberInput
                label="Players"
                value={players}
                min={1}
                step={1}
                onChange={(value) => setPlayers(Math.max(1, Math.floor(value || 1)))}
              />
              <NumberInput
                label="Estimated rebuys per player"
                value={rebuys}
                min={0}
                step={1}
                placeholder="Optional"
                helper="Applied to each player."
                onChange={(value) => setRebuys(Math.max(0, Math.floor(value || 0)))}
              />
            </div>

            <div className="chip-editor">
              <div className="chip-editor-heading">
                <div>
                  <p className="eyebrow">Available chips</p>
                  <h2>Your chip set</h2>
                </div>
                <button className="add-chip" type="button" onClick={addChip}>
                  Add chip
                </button>
              </div>

              <div className="chip-list">
                {chips.map((chip) => (
                  <div className="chip-row" key={chip.id}>
                    <label className="color-field" aria-label={`${chip.name} chip color`}>
                      <input
                        type="color"
                        value={chip.swatch}
                        onChange={(event) => updateChip(chip.id, { swatch: event.target.value })}
                      />
                      <span className="swatch" style={{ background: chip.swatch }} />
                    </label>
                    <input
                      className="chip-name-input"
                      type="text"
                      value={chip.name}
                      placeholder="Color name"
                      onChange={(event) => updateChip(chip.id, { name: event.target.value })}
                    />
                    <input
                      className="chip-count-input"
                      type="number"
                      min="0"
                      step="25"
                      value={chip.count === 0 ? "" : chip.count}
                      placeholder="Amount"
                      onChange={(event) =>
                        updateChip(chip.id, {
                          count: event.target.value === "" ? 0 : Number(event.target.value),
                        })
                      }
                    />
                    <button
                      className="remove-chip"
                      type="button"
                      aria-label={`Remove ${chip.name || "chip"}`}
                      onClick={() => removeChip(chip.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="results">
            <div className="top-results">
              <div className={`status-card ${bankIsShort ? "warning" : ""}`}>
                <p>{bankIsShort ? "Bank is short" : "Bank covered"}</p>
                <strong>{money(bankValue)}</strong>
                <span>
                  Needed for {numberFormat.format(totalBuyIns)} total buy-ins:{" "}
                  {money(totalBankNeeded)}
                </span>
              </div>
              {modeCard}
            </div>

            <div className="panel">
              <div className="panel-heading inline">
                <div>
                  <p className="eyebrow">Recommended set</p>
                  <h2>Chip values</h2>
                </div>
                <span className="pill">{numberFormat.format(totalChipsInPlay)} chips in play</span>
              </div>

              <div className="recommendations">
                {recommendations.map((chip) => (
                  <article className="recommendation" key={chip.id}>
                    <div className="chip-token-wrap">
                      <span
                        className={`chip-token ${chip.id === "white" ? "light" : ""}`}
                        style={{ background: chip.swatch }}
                      />
                    </div>
                    <div>
                      <h3>{chip.name}</h3>
                      <p>{numberFormat.format(chip.count)} available</p>
                    </div>
                    <strong>{money(chip.value)}</strong>
                    <span>{money(chip.totalValue)} bank</span>
                  </article>
                ))}
              </div>
            </div>

            <div className="panel stack-card">
              <div className="panel-heading inline">
                <div>
                  <p className="eyebrow">Starting stack</p>
                  <h2>Per-player chips</h2>
                </div>
                <span className="pill">{money(sampleStackValue)}</span>
              </div>

              <div className="stack-list">
                {recommendations.map((chip) => (
                  <div className="stack-row" key={chip.id}>
                    <span>{chip.name}</span>
                    <strong>{numberFormat.format(chip.perPlayer)} chips</strong>
                    <span>{money(chip.perPlayer * chip.value)}</span>
                  </div>
                ))}
              </div>

              <p className="note">
                Use the suggested starting stack to get the table moving, then keep remaining chips
                in the bank for change-making and rebuys.
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
