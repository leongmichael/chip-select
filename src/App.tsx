import { useMemo, useState } from "react";

type GameMode = "cash" | "tournament";
type StackMode = "money" | "bigBlinds";
type ThemeMode = "light" | "dark";
type TournamentBase = "T25" | "T100" | "T5";
type TournamentTables = "1" | "1-2" | "2" | "3";

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

type StackOverrides = Record<string, number>;

type TournamentChip = {
  denomination: string;
  count: number;
};

type BlindLevel = {
  level: number;
  smallBlind: string;
  bigBlind: string;
  note?: string;
};

type TournamentOption = {
  id: string;
  base: TournamentBase;
  tables: TournamentTables;
  label: string;
  setSize: number;
  stack: string;
  chips: TournamentChip[];
  notes: string[];
};

const DEFAULT_CHIPS: ChipColor[] = [
  { id: "red", name: "Red", count: 200, swatch: "#ef4444" },
  { id: "black", name: "Black", count: 400, swatch: "#171717" },
  { id: "green", name: "Green", count: 400, swatch: "#22c55e" },
  { id: "white", name: "White", count: 400, swatch: "#f8fafc" },
];

const NEW_CHIP_COLORS = ["#3b82f6", "#a855f7", "#f97316", "#14b8a6", "#eab308"];

const TOURNAMENT_OPTIONS: TournamentOption[] = [
  {
    id: "t25-1-8",
    base: "T25",
    tables: "1",
    label: "Smallest one-table T10k set",
    setSize: 300,
    stack: "8/8/4/7",
    chips: [
      { denomination: "T25", count: 80 },
      { denomination: "T100", count: 80 },
      { denomination: "T500", count: 40 },
      { denomination: "T1000", count: 80 },
      { denomination: "T5000", count: 20 },
    ],
    notes: [
      "Supports ten T10k starting stacks.",
      "Extra T1000 chips cover T25/T100 color-ups.",
      "T5000 chips can cover rebuys, deeper stacks, and later color-ups.",
    ],
  },
  {
    id: "t25-1-12-5",
    base: "T25",
    tables: "1",
    label: "Classic one-table T10k set",
    setSize: 400,
    stack: "12/12/5/6",
    chips: [
      { denomination: "T25", count: 120 },
      { denomination: "T100", count: 120 },
      { denomination: "T500", count: 50 },
      { denomination: "T1000", count: 75 },
      { denomination: "T5000", count: 35 },
    ],
    notes: [
      "Supports ten T10k starting stacks.",
      "Uses the common 12/12/5/6 T25/T100/T500/T1000 stack.",
      "T5000 chips cover rebuys, deeper stacks, and T500 color-ups.",
    ],
  },
  {
    id: "t25-1-12-7",
    base: "T25",
    tables: "1",
    label: "One-table T10k set with extra T500s",
    setSize: 400,
    stack: "12/12/7/5",
    chips: [
      { denomination: "T25", count: 120 },
      { denomination: "T100", count: 120 },
      { denomination: "T500", count: 70 },
      { denomination: "T1000", count: 65 },
      { denomination: "T5000", count: 25 },
    ],
    notes: [
      "Supports ten T10k starting stacks.",
      "Adds more T500 chips to the table.",
      "T5000 chips remain available for rebuys and color-ups.",
    ],
  },
  {
    id: "t25-flex-600",
    base: "T25",
    tables: "1-2",
    label: "Flexible 600-chip T25 set",
    setSize: 600,
    stack: "12/12/5/6 or 8/8/4/7",
    chips: [
      { denomination: "T25", count: 160 },
      { denomination: "T100", count: 160 },
      { denomination: "T500", count: 80 },
      { denomination: "T1000", count: 160 },
      { denomination: "T5000", count: 40 },
    ],
    notes: [
      "For one table, supports twelve T10k stacks of 12/12/5/6.",
      "For two tables, supports twenty T10k stacks of 8/8/4/7.",
      "Includes extra T1000s for color-ups and T5000s for rebuys/deeper stacks.",
    ],
  },
  {
    id: "t25-2-12",
    base: "T25",
    tables: "2",
    label: "Two-table classic T25 set",
    setSize: 800,
    stack: "12/12/5/6",
    chips: [
      { denomination: "T25", count: 240 },
      { denomination: "T100", count: 240 },
      { denomination: "T500", count: 100 },
      { denomination: "T1000", count: 150 },
      { denomination: "T5000", count: 70 },
    ],
    notes: [
      "Supports twenty T10k starting stacks.",
      "Uses the classic 12/12/5/6 starting stack.",
      "T5000 chips support rebuys and color-ups.",
    ],
  },
  {
    id: "t25-3",
    base: "T25",
    tables: "3",
    label: "Three-table T25 set",
    setSize: 1000,
    stack: "8/8/4/7/3",
    chips: [
      { denomination: "T25", count: 240 },
      { denomination: "T100", count: 240 },
      { denomination: "T500", count: 120 },
      { denomination: "T1000", count: 240 },
      { denomination: "T5000", count: 150 },
      { denomination: "T25000", count: 10 },
    ],
    notes: [
      "Supports thirty T25k starting stacks with five rebuys.",
      "Also supports up to twenty players with larger T40k stacks.",
      "A strong set when you need real multi-table coverage.",
    ],
  },
  {
    id: "t100-1-small",
    base: "T100",
    tables: "1",
    label: "Small one-table T100 set",
    setSize: 300,
    stack: "10/4/7/4",
    chips: [
      { denomination: "T100", count: 100 },
      { denomination: "T500", count: 40 },
      { denomination: "T1000", count: 80 },
      { denomination: "T5000", count: 80 },
    ],
    notes: [
      "Supports up to ten T30k starting stacks.",
      "Extra T1000 and T5000 chips support color-ups.",
      "A compact but playable one-table set.",
    ],
  },
  {
    id: "t100-1-deep",
    base: "T100",
    tables: "1",
    label: "Deeper one-table T100 set",
    setSize: 400,
    stack: "10/6/11/7",
    chips: [
      { denomination: "T100", count: 100 },
      { denomination: "T500", count: 60 },
      { denomination: "T1000", count: 120 },
      { denomination: "T5000", count: 120 },
    ],
    notes: [
      "Supports up to ten T50k starting stacks.",
      "More chips in each stack for deeper play.",
      "Adjust T5000s for more rebuys or deeper stacks.",
    ],
  },
  {
    id: "t100-1-antes",
    base: "T100",
    tables: "1",
    label: "One-table T100 set with extra T100s",
    setSize: 400,
    stack: "15/5/11/3",
    chips: [
      { denomination: "T100", count: 150 },
      { denomination: "T500", count: 50 },
      { denomination: "T1000", count: 125 },
      { denomination: "T5000", count: 75 },
    ],
    notes: [
      "Supports up to ten T30k starting stacks.",
      "Extra T100 chips help cover antes.",
      "T1000/T5000 chips support color-ups.",
    ],
  },
  {
    id: "t100-1-plus",
    base: "T100",
    tables: "1",
    label: "One-table T100 set with extra T5000s",
    setSize: 500,
    stack: "15/5/11/7",
    chips: [
      { denomination: "T100", count: 150 },
      { denomination: "T500", count: 50 },
      { denomination: "T1000", count: 125 },
      { denomination: "T5000", count: 175 },
    ],
    notes: [
      "Supports up to ten T50k starting stacks.",
      "Extra T100s help cover antes.",
      "Extra T5000s make deeper stacks and rebuys easier.",
    ],
  },
  {
    id: "t100-flex-500",
    base: "T100",
    tables: "1-2",
    label: "Flexible 500-chip T100 set",
    setSize: 500,
    stack: "10/4/7/2 or 15/5/11/5",
    chips: [
      { denomination: "T100", count: 200 },
      { denomination: "T500", count: 80 },
      { denomination: "T1000", count: 160 },
      { denomination: "T5000", count: 60 },
    ],
    notes: [
      "Supports twenty T20k stacks using 10/4/7/2.",
      "Also supports one table of ten T40k stacks using 15/5/11/5.",
      "Includes extra T5000s for a few rebuys.",
    ],
  },
  {
    id: "t100-2-deep",
    base: "T100",
    tables: "2",
    label: "Two-table deeper T100 set",
    setSize: 700,
    stack: "10/6/11/3",
    chips: [
      { denomination: "T100", count: 200 },
      { denomination: "T500", count: 120 },
      { denomination: "T1000", count: 240 },
      { denomination: "T5000", count: 140 },
    ],
    notes: [
      "Supports up to twenty T30k starting stacks.",
      "Additional T5000s cover ten-plus rebuys or deeper stacks.",
      "Good for regular two-table tournaments.",
    ],
  },
  {
    id: "t5-1",
    base: "T5",
    tables: "1",
    label: "One-table T5 set",
    setSize: 300,
    stack: "10/10/7/2",
    chips: [
      { denomination: "T5", count: 100 },
      { denomination: "T25", count: 100 },
      { denomination: "T100", count: 70 },
      { denomination: "T500", count: 30 },
    ],
    notes: [
      "Supports ten T2k starting stacks.",
      "Extra T500s color up T5/T25 chips.",
      "Includes enough extras for one rebuy.",
    ],
  },
  {
    id: "t5-2",
    base: "T5",
    tables: "2",
    label: "Two-table T5 set",
    setSize: 600,
    stack: "10/10/7/2",
    chips: [
      { denomination: "T5", count: 200 },
      { denomination: "T25", count: 200 },
      { denomination: "T100", count: 140 },
      { denomination: "T500", count: 60 },
    ],
    notes: [
      "Supports twenty T2k starting stacks.",
      "Extra T500s color up T5/T25 chips.",
      "Includes enough extras for two rebuys.",
    ],
  },
];

const BLIND_STRUCTURES: Record<TournamentBase, BlindLevel[]> = {
  T25: [
    { level: 1, smallBlind: "25", bigBlind: "50" },
    { level: 2, smallBlind: "50", bigBlind: "100" },
    { level: 3, smallBlind: "75", bigBlind: "150" },
    { level: 4, smallBlind: "100", bigBlind: "200" },
    { level: 5, smallBlind: "150", bigBlind: "300" },
    { level: 6, smallBlind: "200", bigBlind: "400", note: "Color up T25" },
    { level: 7, smallBlind: "300", bigBlind: "600" },
    { level: 8, smallBlind: "400", bigBlind: "800" },
    { level: 9, smallBlind: "600", bigBlind: "1200" },
    { level: 10, smallBlind: "800", bigBlind: "1600" },
    { level: 11, smallBlind: "1000", bigBlind: "2000", note: "Color up T100" },
    { level: 12, smallBlind: "1500", bigBlind: "3000" },
  ],
  T100: [
    { level: 1, smallBlind: "100", bigBlind: "100" },
    { level: 2, smallBlind: "100", bigBlind: "200" },
    { level: 3, smallBlind: "200", bigBlind: "400" },
    { level: 4, smallBlind: "300", bigBlind: "600" },
    { level: 5, smallBlind: "400", bigBlind: "800" },
    { level: 6, smallBlind: "600", bigBlind: "1200" },
    { level: 7, smallBlind: "800", bigBlind: "1600" },
    { level: 8, smallBlind: "1000", bigBlind: "2000", note: "Color up T100" },
    { level: 9, smallBlind: "1500", bigBlind: "3000" },
    { level: 10, smallBlind: "2000", bigBlind: "4000", note: "Color up T500" },
    { level: 11, smallBlind: "3000", bigBlind: "4000" },
    { level: 12, smallBlind: "4000", bigBlind: "6000" },
  ],
  T5: [
    { level: 1, smallBlind: "5", bigBlind: "10" },
    { level: 2, smallBlind: "10", bigBlind: "20" },
    { level: 3, smallBlind: "15", bigBlind: "30" },
    { level: 4, smallBlind: "20", bigBlind: "40" },
    { level: 5, smallBlind: "30", bigBlind: "60" },
    { level: 6, smallBlind: "40", bigBlind: "80" },
    { level: 7, smallBlind: "50", bigBlind: "100", note: "Color up T5" },
    { level: 8, smallBlind: "75", bigBlind: "150" },
    { level: 9, smallBlind: "100", bigBlind: "200" },
    { level: 10, smallBlind: "150", bigBlind: "300" },
    { level: 11, smallBlind: "200", bigBlind: "400", note: "Color up T25" },
    { level: 12, smallBlind: "300", bigBlind: "600" },
  ],
};

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
  overrides: StackOverrides = {},
) {
  if (players <= 0 || buyIn <= 0) {
    return recommendations.map(() => 0);
  }

  const hasOverrides = Object.keys(overrides).length > 0;
  const counts = recommendations.map(() => 0);

  if (hasOverrides) {
    let remaining = buyIn;
    const overriddenIds = new Set(Object.keys(overrides));

    recommendations.forEach((chip, index) => {
      if (!overriddenIds.has(chip.id)) {
        return;
      }

      const perPlayerAvailable = Math.floor(chip.count / players);
      const amount = clamp(Math.floor(overrides[chip.id] ?? 0), 0, perPlayerAvailable);

      counts[index] = amount;
      remaining = roundMoney(remaining - amount * chip.value);
    });

    for (let index = recommendations.length - 1; index >= 0; index -= 1) {
      const chip = recommendations[index];

      if (overriddenIds.has(chip.id)) {
        continue;
      }

      const available = Math.max(0, Math.floor(chip.count / players) - counts[index]);
      const amount = Math.min(available, Math.max(0, Math.floor((remaining + 0.001) / chip.value)));

      counts[index] += amount;
      remaining = roundMoney(remaining - amount * chip.value);
    }

    if (remaining > 0) {
      const firstFlexibleIndex = recommendations.findIndex((chip) => !overriddenIds.has(chip.id));
      const fallbackIndex = firstFlexibleIndex >= 0 ? firstFlexibleIndex : 0;
      const chip = recommendations[fallbackIndex];
      const available = Math.max(0, Math.floor(chip.count / players) - counts[fallbackIndex]);
      const extra = Math.min(Math.ceil(remaining / chip.value), available);

      counts[fallbackIndex] += extra;
    }

    return counts;
  }

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
  value: number | string;
  min?: number;
  step?: number;
  onChange: (value: number, rawValue: string) => void;
  prefix?: string;
  helper?: string;
  placeholder?: string;
}) {
  const displayValue = typeof value === "number" && value === 0 ? "" : value;

  return (
    <label className="field">
      {label ? <span>{label}</span> : null}
      <div className="input-shell">
        {prefix ? <span className="prefix">{prefix}</span> : null}
        <input
          type="number"
          min={min}
          step={step}
          value={displayValue}
          placeholder={placeholder}
          onChange={(event) =>
            onChange(event.target.value === "" ? 0 : Number(event.target.value), event.target.value)
          }
        />
      </div>
      {helper ? <small>{helper}</small> : null}
    </label>
  );
}

export default function App() {
  const [mode, setMode] = useState<GameMode>("cash");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [stackMode, setStackMode] = useState<StackMode>("money");
  const [stackMoney, setStackMoney] = useState(50);
  const [stackBigBlinds, setStackBigBlinds] = useState(100);
  const [smallBlindInput, setSmallBlindInput] = useState("0.25");
  const [bigBlindInput, setBigBlindInput] = useState("0.5");
  const [playersInput, setPlayersInput] = useState("5");
  const [rebuys, setRebuys] = useState(0);
  const [chips, setChips] = useState<ChipColor[]>(DEFAULT_CHIPS);
  const [stackOverrides, setStackOverrides] = useState<StackOverrides>({});
  const [tournamentBase, setTournamentBase] = useState<TournamentBase>("T25");
  const [tournamentTables, setTournamentTables] = useState<TournamentTables>("1");
  const [tournamentOptionId, setTournamentOptionId] = useState("t25-1-12-5");

  const activeChips = chips
    .filter((chip) => chip.count > 0 && chip.name.trim().length > 0)
    .sort((first, second) => second.count - first.count);
  const smallBlind = Number(smallBlindInput) || 0;
  const bigBlind = Number(bigBlindInput) || 0;
  const players = Math.max(1, Math.floor(Number(playersInput) || 1));
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

    const perPlayerCounts = calculatePerPlayerChips(
      baseRecommendations,
      buyIn,
      players,
      stackOverrides,
    );

    return baseRecommendations.map((chip, index) => ({
      ...chip,
      perPlayer: perPlayerCounts[index] ?? 0,
    }));
  }, [activeChips, bigBlind, buyIn, players, smallBlind, stackOverrides, totalBankNeeded]);

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
  const tournamentOptions = TOURNAMENT_OPTIONS.filter(
    (option) => option.base === tournamentBase && option.tables === tournamentTables,
  );
  const selectedTournamentOption =
    tournamentOptions.find((option) => option.id === tournamentOptionId) ?? tournamentOptions[0];
  const blindStructure = BLIND_STRUCTURES[tournamentBase];

  const updateTournamentBase = (base: TournamentBase) => {
    const nextOption = TOURNAMENT_OPTIONS.find((option) => option.base === base);

    setTournamentBase(base);
    setTournamentTables(nextOption?.tables ?? "1");
    setTournamentOptionId(nextOption?.id ?? "");
  };

  const updateTournamentTables = (tables: TournamentTables) => {
    const nextOption = TOURNAMENT_OPTIONS.find(
      (option) => option.base === tournamentBase && option.tables === tables,
    );

    setTournamentTables(tables);
    setTournamentOptionId(nextOption?.id ?? "");
  };

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
    setStackOverrides((current) => {
      const { [id]: _removed, ...remaining } = current;

      return remaining;
    });
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
      </button>
    </div>
  );

  return (
    <main className="app" data-theme={theme}>
      <section className="hero">
        <div>
          <div className="title-row">
            <p className="app-title">Chip Select</p>
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
            >
              {theme === "light" ? "Dark mode" : "Light mode"}
            </button>
          </div>
          <div className="hero-message">
            <h1>Pick chip values that fit your game and your case.</h1>
          </div>
        </div>
      </section>
      <div className="mobile-mode">{modeCard}</div>

      {mode === "tournament" ? (
        <section className="workspace tournament-workspace">
          <div className="panel controls">
            <div className="panel-heading">
              <p className="eyebrow">Tournament inputs</p>
              <h2>Preset selector</h2>
            </div>

            <div className="tournament-form">
              <label className="field">
                <span>Base chip</span>
                <select
                  value={tournamentBase}
                  onChange={(event) => updateTournamentBase(event.target.value as TournamentBase)}
                >
                  <option value="T25">T25 - classic</option>
                  <option value="T100">T100 - big blind ante friendly</option>
                  <option value="T5">T5 - smaller home tourneys</option>
                </select>
              </label>

              <label className="field">
                <span>Tables to support</span>
                <select
                  value={tournamentTables}
                  onChange={(event) =>
                    updateTournamentTables(event.target.value as TournamentTables)
                  }
                >
                  {Array.from(
                    new Set(
                      TOURNAMENT_OPTIONS.filter((option) => option.base === tournamentBase).map(
                        (option) => option.tables,
                      ),
                    ),
                  ).map((tables) => (
                    <option key={tables} value={tables}>
                      {tables === "1"
                        ? "Just one"
                        : tables === "1-2"
                          ? "Usually one, sometimes two"
                          : tables === "2"
                            ? "Two"
                            : "Three"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field tournament-option-field">
                <span>Starting-stack style</span>
                <select
                  value={selectedTournamentOption?.id ?? ""}
                  onChange={(event) => setTournamentOptionId(event.target.value)}
                >
                  {tournamentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label} ({option.stack})
                    </option>
                  ))}
                </select>
                <small>
                  Stack notation follows the PDF: chips per denomination in each starting stack.
                </small>
              </label>
            </div>
          </div>

          <div className="results">
            <div className="top-results">
              <div className="status-card">
                <p>Tournament set</p>
                <strong>{numberFormat.format(selectedTournamentOption?.setSize ?? 0)}</strong>
                <span>{selectedTournamentOption?.label ?? "Choose a preset"} chips</span>
              </div>
              {modeCard}
            </div>

            {selectedTournamentOption ? (
              <>
                <div className="panel">
                  <div className="panel-heading inline">
                    <div>
                      <p className="eyebrow">Recommended set</p>
                      <h2>{selectedTournamentOption.base} tournament chips</h2>
                    </div>
                    <span className="pill">{selectedTournamentOption.stack}</span>
                  </div>

                  <div className="tournament-chip-grid">
                    {selectedTournamentOption.chips.map((chip) => (
                      <article className="tournament-chip-card" key={chip.denomination}>
                        <span>{chip.denomination}</span>
                        <strong>{numberFormat.format(chip.count)}</strong>
                      </article>
                    ))}
                  </div>

                  <div className="tournament-notes">
                    {selectedTournamentOption.notes.map((note) => (
                      <p key={note}>{note}</p>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-heading inline">
                    <div>
                      <p className="eyebrow">Blind structure</p>
                      <h2>Starter schedule</h2>
                    </div>
                    <span className="pill">{selectedTournamentOption.base}</span>
                  </div>

                  <div className="blind-table">
                    {blindStructure.map((level) => (
                      <div className="blind-row" key={level.level}>
                        <span>Level {level.level}</span>
                        <strong>
                          {level.smallBlind} / {level.bigBlind}
                        </strong>
                        <span>{level.note ?? ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <section className="placeholder-card">
                <p className="eyebrow">No preset</p>
                <h2>No PDF preset matched this combination.</h2>
                <p>Choose a different base or table count to see a tournament set.</p>
              </section>
            )}
          </div>
        </section>
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
                value={smallBlindInput}
                min={0.01}
                step={0.25}
                prefix="$"
                onChange={(_, rawValue) => setSmallBlindInput(rawValue)}
              />
              <NumberInput
                label="Big blind"
                value={bigBlindInput}
                min={0.01}
                step={0.25}
                prefix="$"
                onChange={(_, rawValue) => setBigBlindInput(rawValue)}
              />
              <NumberInput
                label="Players"
                value={playersInput}
                min={1}
                step={1}
                onChange={(_, rawValue) => setPlayersInput(rawValue)}
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
                    <label
                      className="color-field chip-token-wrap"
                      aria-label={`Change ${chip.name} denomination color`}
                    >
                      <input
                        type="color"
                        value={chip.swatch}
                        onChange={(event) => updateChip(chip.id, { swatch: event.target.value })}
                      />
                      <span
                        className={`chip-token ${chip.id === "white" ? "light" : ""}`}
                        style={{ background: chip.swatch }}
                      />
                    </label>
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
                <div className="stack-actions">
                  {Object.keys(stackOverrides).length > 0 ? (
                    <button
                      className="reset-stack"
                      type="button"
                      onClick={() => setStackOverrides({})}
                    >
                      Auto
                    </button>
                  ) : null}
                  <span className="pill">{money(sampleStackValue)}</span>
                </div>
              </div>

              <div className="stack-list">
                {recommendations.map((chip) => {
                  const maxPerPlayer = Math.floor(chip.count / players);

                  return (
                    <div className="stack-row adjustable" key={chip.id}>
                      <span>{chip.name}</span>
                      <strong>{numberFormat.format(chip.perPlayer)} chips</strong>
                      <span>{money(chip.perPlayer * chip.value)}</span>
                      <label className="stack-slider">
                        <input
                          type="range"
                          min="0"
                          max={maxPerPlayer}
                          step="1"
                          value={chip.perPlayer}
                          onChange={(event) =>
                            setStackOverrides((current) => ({
                              ...current,
                              [chip.id]: Number(event.target.value),
                            }))
                          }
                        />
                      </label>
                    </div>
                  );
                })}
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
