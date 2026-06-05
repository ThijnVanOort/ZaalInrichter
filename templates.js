// Kring:     14 tables, 19 chairs
// Standaard: 21 tables, 37 chairs
// Halfrond:  kring zonder onderste stoelen voor bureau — 14 tafels, 15 stoelen

const TABLE_TYPES = ["table-h", "table-v", "table-corner", "desk"];

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

const KRING_ITEMS = [
      { type: "table-h", x: 110, y: 60 },
      { type: "table-h", x: 238, y: 60 },
      { type: "table-h", x: 366, y: 60 },
      { type: "table-h", x: 494, y: 60 },
      { type: "table-h", x: 622, y: 60 },
      { type: "table-v", x: 820, y: 60 },
      { type: "table-v", x: 820, y: 172 },
      { type: "table-v", x: 820, y: 284 },
      { type: "table-v", x: 820, y: 396 },
      { type: "table-v", x: 60, y: 220 },
      { type: "table-v", x: 60, y: 332 },
      { type: "table-h", x: 308, y: 108 },
      { type: "table-h", x: 436, y: 108 },
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
    expected: { tables: 20, chairs: 37 },
    items: [
      { type: "table-corner", x: 108, y: 108 },
      { type: "table-h", x: 144, y: 108 },
      { type: "table-h", x: 272, y: 108 },
      { type: "table-h", x: 400, y: 108 },
      { type: "table-h", x: 528, y: 108 },
      { type: "table-h", x: 656, y: 108 },
      { type: "table-corner", x: 784, y: 108 },
      { type: "table-v", x: 108, y: 144 },
      { type: "table-v", x: 108, y: 256 },
      { type: "table-v", x: 108, y: 368 },
      { type: "table-v", x: 784, y: 144 },
      { type: "table-v", x: 784, y: 256 },
      { type: "table-v", x: 784, y: 368 },
      { type: "table-h", x: 278, y: 198 },
      { type: "table-h", x: 406, y: 198 },
      { type: "table-h", x: 534, y: 198 },
      { type: "table-v", x: 242, y: 198 },
      { type: "table-v", x: 242, y: 310 },
      { type: "table-v", x: 662, y: 198 },
      { type: "table-v", x: 662, y: 310 },
      ...chairsBehindTableH(144, 108, "top"),
      ...chairsBehindTableH(272, 108, "top"),
      ...chairsBehindTableH(400, 108, "top"),
      ...chairsBehindTableH(528, 108, "top"),
      ...chairsBehindTableH(656, 108, "top"),
      ...chairsBehindTableV(108, 144, "left"),
      ...chairsBehindTableV(108, 256, "left"),
      ...chairsBehindTableV(108, 368, "left"),
      ...chairsBehindTableV(784, 144, "right"),
      ...chairsBehindTableV(784, 256, "right"),
      ...chairsBehindTableV(784, 368, "right"),
      ...chairsBehindTableH(278, 198, "top"),
      ...chairsBehindTableH(406, 198, "top"),
      ...chairsBehindTableH(534, 198, "top"),
      ...chairsBehindTableV(242, 198, "left"),
      ...chairsBehindTableV(242, 310, "left"),
      ...chairsBehindTableV(662, 198, "right"),
      ...chairsBehindTableV(662, 310, "right"),
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

  theater: {
    title: "Collegezaal",
    subtitle: "Theater indeling",
    expected: { tables: 0, chairs: 30 },
    items: [
      ...Array.from({ length: 6 }, (_, col) =>
        Array.from({ length: 5 }, (_, row) => ({
          type: "chair",
          x: 210 + col * 82,
          y: 130 + row * 72,
        }))
      ).flat(),
    ],
  },

  examen: {
    title: "Collegezaal",
    subtitle: "Examen indeling",
    expected: { tables: 20, chairs: 20 },
    items: [
      ...Array.from({ length: 5 }, (_, col) =>
        Array.from({ length: 4 }, (_, row) => [
          { type: "desk", x: 140 + col * 140, y: 110 + row * 120 },
          { type: "chair", x: 152 + col * 140, y: 152 + row * 120 },
        ])
      ).flat(2),
    ],
  },

  workshop: {
    title: "Collegezaal",
    subtitle: "Workshop indeling",
    expected: { tables: 8, chairs: 24 },
    items: [
      ...[200, 500].flatMap((baseX) =>
        [160, 360].flatMap((baseY) => [
          { type: "table-h", x: baseX, y: baseY },
          { type: "table-h", x: baseX, y: baseY + 36 },
          { type: "chair", x: baseX - 52, y: baseY + 4 },
          { type: "chair", x: baseX - 52, y: baseY + 62 },
          { type: "chair", x: baseX + 148, y: baseY + 4 },
          { type: "chair", x: baseX + 148, y: baseY + 62 },
          { type: "chair", x: baseX + 50, y: baseY - 52 },
          { type: "chair", x: baseX + 50, y: baseY + 118 },
        ])
      ),
    ],
  },

  boardroom: {
    title: "Collegezaal",
    subtitle: "Vergadering",
    expected: { tables: 3, chairs: 12 },
    items: [
      { type: "table-h", x: 290, y: 280 },
      { type: "table-h", x: 422, y: 280 },
      { type: "table-h", x: 554, y: 280 },
      { type: "chair", x: 300, y: 232 },
      { type: "chair", x: 370, y: 232 },
      { type: "chair", x: 432, y: 232 },
      { type: "chair", x: 502, y: 232 },
      { type: "chair", x: 564, y: 232 },
      { type: "chair", x: 634, y: 232 },
      { type: "chair", x: 300, y: 338 },
      { type: "chair", x: 432, y: 338 },
      { type: "chair", x: 564, y: 338 },
      { type: "chair", x: 634, y: 338 },
      { type: "chair", x: 232, y: 280 },
      { type: "chair", x: 232, y: 318 },
    ],
  },
};
