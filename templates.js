// Kring:     14 tables, 19 chairs
// Standaard: 16 tables, 29 chairs
// Halfrond:  kring zonder onderste stoelen voor bureau — 14 tafels, 15 stoelen

const TABLE_TYPES = ["table", "table-corner", "desk"];

const CHAIR_GAP_H = 44;
const CHAIR_GAP_V = 58;
const CHAIR_TABLE_GAP = 44;

function chairsBehindTableH(x, y, wallSide = "top", count = 2) {
  return Array.from({ length: count }, (_, i) => ({
    type: "chair",
    x: x + 18 + i * CHAIR_GAP_H,
    y: wallSide === "top" ? y - CHAIR_TABLE_GAP : y + 40,
    rotation: wallSide === "top" ? 180 : 0,
  }));
}

function chairsBehindTableV(x, y, wallSide = "left", count = 2) {
  return Array.from({ length: count }, (_, i) => ({
    type: "chair",
    x: wallSide === "left" ? x - CHAIR_TABLE_GAP : x + 40,
    y: y + 22 + i * CHAIR_GAP_V,
    rotation: wallSide === "left" ? 90 : 270,
  }));
}

const TABLE_W = 128;
const TABLE_H = 36;

function workshopTablePair(baseX, baseY) {
  const pairH = TABLE_H * 2;
  return [
    { type: "table", x: baseX, y: baseY },
    { type: "table", x: baseX, y: baseY + TABLE_H },
    { type: "chair", x: baseX + 18, y: baseY - CHAIR_TABLE_GAP, rotation: 180 },
    { type: "chair", x: baseX + 62, y: baseY - CHAIR_TABLE_GAP, rotation: 180 },
    { type: "chair", x: baseX + 18, y: baseY + pairH + 8, rotation: 0 },
    { type: "chair", x: baseX + 62, y: baseY + pairH + 8, rotation: 0 },
    { type: "chair", x: baseX - CHAIR_TABLE_GAP, y: baseY + 4, rotation: 90 },
    { type: "chair", x: baseX - CHAIR_TABLE_GAP, y: baseY + 38, rotation: 90 },
    { type: "chair", x: baseX + TABLE_W + 6, y: baseY + 4, rotation: 270 },
    { type: "chair", x: baseX + TABLE_W + 6, y: baseY + 38, rotation: 270 },
  ];
}

function boardroomTableBlock(baseX, baseY) {
  const cols = 3;
  const rows = 2;
  const blockW = TABLE_W * cols;
  const blockH = TABLE_H * rows;
  const tables = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      type: "table",
      x: baseX + col * TABLE_W,
      y: baseY + row * TABLE_H,
    }))
  ).flat();

  const chairs = [
    ...Array.from({ length: cols }, (_, col) => [
      {
        type: "chair",
        x: baseX + col * TABLE_W + 18,
        y: baseY - CHAIR_TABLE_GAP,
        rotation: 180,
      },
      {
        type: "chair",
        x: baseX + col * TABLE_W + 62,
        y: baseY - CHAIR_TABLE_GAP,
        rotation: 180,
      },
    ]).flat(),
    ...Array.from({ length: cols }, (_, col) => [
      {
        type: "chair",
        x: baseX + col * TABLE_W + 18,
        y: baseY + blockH + 8,
        rotation: 0,
      },
      {
        type: "chair",
        x: baseX + col * TABLE_W + 62,
        y: baseY + blockH + 8,
        rotation: 0,
      },
    ]).flat(),
    {
      type: "chair",
      x: baseX - CHAIR_TABLE_GAP,
      y: baseY + 19,
      rotation: 90,
    },
    {
      type: "chair",
      x: baseX - CHAIR_TABLE_GAP,
      y: baseY + 41,
      rotation: 90,
    },
    {
      type: "chair",
      x: baseX + blockW + 6,
      y: baseY + 19,
      rotation: 270,
    },
    {
      type: "chair",
      x: baseX + blockW + 6,
      y: baseY + 41,
      rotation: 270,
    },
  ];

  return [...tables, ...chairs];
}

const KRING_ITEMS = [
      { type: "table", x: 110, y: 60 },
      { type: "table", x: 238, y: 60 },
      { type: "table", x: 366, y: 60 },
      { type: "table", x: 494, y: 60 },
      { type: "table", x: 622, y: 60 },
      { type: "table", x: 820, y: 60, rotation: 90 },
      { type: "table", x: 820, y: 172, rotation: 90 },
      { type: "table", x: 820, y: 284, rotation: 90 },
      { type: "table", x: 820, y: 396, rotation: 90 },
      { type: "table", x: 60, y: 220, rotation: 90 },
      { type: "table", x: 60, y: 332, rotation: 90 },
      { type: "table", x: 308, y: 108 },
      { type: "table", x: 436, y: 108 },
      { type: "chair", x: 248, y: 168 },
      { type: "chair", x: 316, y: 168 },
      { type: "chair", x: 384, y: 168 },
      { type: "chair", x: 452, y: 168 },
      { type: "chair", x: 520, y: 168 },
      { type: "chair", x: 588, y: 168 },
      { type: "chair", x: 596, y: 228 },
      { type: "chair", x: 596, y: 296 },
      { type: "chair", x: 596, y: 364 },
      { type: "chair", x: 596, y: 432 },
      { type: "chair", x: 588, y: 462 },
      { type: "chair", x: 520, y: 462 },
      { type: "chair", x: 452, y: 462 },
      { type: "chair", x: 384, y: 462 },
      { type: "chair", x: 224, y: 228 },
      { type: "chair", x: 224, y: 296 },
      { type: "chair", x: 224, y: 364 },
      { type: "chair", x: 224, y: 432 },
      { type: "chair", x: 418, y: 548 },
];

// Halfrond = kring minus stoelen aan voorkant van het bureau (onderste kringrij)
const HALFROND_ITEMS = KRING_ITEMS.filter(
  (item) => !(item.type === "chair" && item.y === 462)
);

const TEMPLATES = {
  kring: {
    title: "Collegezaal",
    subtitle: "Kring indeling",
    expected: { tables: 13, chairs: 19 },
    items: KRING_ITEMS,
  },

  standaard: {
    title: "Collegezaal",
    subtitle: "Standaard indeling",
    expected: { tables: 16, chairs: 29 },
    items: [
      { type: "table-corner", x: 108, y: 108 },
      { type: "table", x: 144, y: 108 },
      { type: "table", x: 272, y: 108 },
      { type: "table", x: 400, y: 108 },
      { type: "table", x: 528, y: 108 },
      { type: "table", x: 656, y: 108 },
      { type: "table-corner", x: 784, y: 108 },
      { type: "table", x: 108, y: 144, rotation: 90 },
      { type: "table", x: 108, y: 272, rotation: 90 },
      { type: "table", x: 784, y: 144, rotation: 90 },
      { type: "table", x: 784, y: 272, rotation: 90 },
      { type: "table", x: 278, y: 198 },
      { type: "table", x: 406, y: 198 },
      { type: "table", x: 534, y: 198 },
      { type: "table", x: 242, y: 234, rotation: 90 },
      { type: "table", x: 662, y: 234, rotation: 90 },
      ...chairsBehindTableH(144, 108, "top"),
      ...chairsBehindTableH(272, 108, "top"),
      ...chairsBehindTableH(400, 108, "top"),
      ...chairsBehindTableH(528, 108, "top"),
      ...chairsBehindTableH(656, 108, "top"),
      ...chairsBehindTableV(108, 144, "left"),
      ...chairsBehindTableV(108, 272, "left"),
      ...chairsBehindTableV(784, 144, "right"),
      ...chairsBehindTableV(784, 272, "right"),
      ...chairsBehindTableH(278, 198, "top"),
      ...chairsBehindTableH(406, 198, "top"),
      ...chairsBehindTableH(534, 198, "top"),
      ...chairsBehindTableV(242, 234, "left"),
      ...chairsBehindTableV(662, 234, "right"),
      { type: "chair", x: 434, y: 546, rotation: 0 },
    ],
  },

  halfrond: {
    title: "Collegezaal",
    subtitle: "Halfrond indeling",
    expected: { tables: 13, chairs: 15 },
    items: HALFROND_ITEMS,
  },

  empty: {
    title: "Collegezaal",
    subtitle: "",
    expected: { tables: 0, chairs: 0 },
    items: [],
  },

  examen: {
    title: "Collegezaal",
    subtitle: "Examen indeling",
    expected: { tables: 15, chairs: 15 },
    items: [
      ...Array.from({ length: 5 }, (_, col) =>
        Array.from({ length: 3 }, (_, row) => [
          { type: "desk", x: 140 + col * 140, y: 110 + row * 120 },
          { type: "chair", x: 152 + col * 140, y: 152 + row * 120 },
        ])
      ).flat(2),
    ],
  },

  workshop: {
    title: "Collegezaal",
    subtitle: "Workshop indeling",
    expected: { tables: 8, chairs: 32 },
    items: [
      ...[200, 500].flatMap((baseX) =>
        [160, 360].flatMap((baseY) => workshopTablePair(baseX, baseY))
      ),
    ],
  },

  boardroom: {
    title: "Collegezaal",
    subtitle: "Vergadering",
    expected: { tables: 6, chairs: 16 },
    items: boardroomTableBlock(258, 240),
  },
};
