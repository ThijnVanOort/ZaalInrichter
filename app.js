const GRID = 10;

const ROOM = {
  width: 900,
  height: 640,
  wall: { left: 44, top: 52, right: 856, bottom: 588 },
  doorGaps: [
    { y1: 52, y2: 104 },
    { y1: 536, y2: 588 },
  ],
  doors: [
    { x: 0, y: 52 },
    { x: 0, y: 536 },
  ],
  presentationDesk: { x: 422, y: 500 },
};

const ASSET_SIZES = {
  chair: { w: 34, h: 34, src: "assets/chair.png" },
  table: { w: 128, h: 36, src: "assets/table-h.png" },
  "table-corner": { w: 36, h: 36, src: "assets/table-corner.png" },
  desk: { w: 56, h: 34, src: "assets/desk.png" },
  door: { w: 44, h: 52, src: "assets/door.png" },
};

const ROTATE_STEP = 90;

const canvas = document.getElementById("canvas");
const wallsSvg = document.getElementById("room-walls");
const fixedLayer = document.getElementById("fixed-layer");
const itemsLayer = document.getElementById("items-layer");
const selectionBox = document.getElementById("selection-box");
const tableCountEl = document.getElementById("table-count");
const chairCountEl = document.getElementById("chair-count");
const targetCountEl = document.getElementById("target-count");
let items = [];
let selectedIds = new Set();
let dragState = null;
let marqueeState = null;
let nextId = 1;
let currentExpected = null;

const MAX_HISTORY = 50;
let undoStack = [];
let redoStack = [];
let isRestoring = false;

function snap(value) {
  return Math.round(value / GRID) * GRID;
}

function clampToRoom(x, y, w, h) {
  const { wall } = ROOM;
  return {
    x: Math.max(wall.left + 4, Math.min(x, wall.right - w - 4)),
    y: Math.max(wall.top + 4, Math.min(y, wall.bottom - h - 4)),
  };
}

function getAsset(type) {
  return ASSET_SIZES[type];
}

function getEffectiveSize(type, rotation = 0) {
  const asset = getAsset(type);
  if (!asset) return null;
  if (rotation === 90 || rotation === 270) {
    return { w: asset.h, h: asset.w, src: asset.src };
  }
  return { w: asset.w, h: asset.h, src: asset.src };
}

function renderWalls() {
  const { wall, doorGaps } = ROOM;
  const lines = [
    `M ${wall.left} ${wall.top} H ${wall.right}`,
    `M ${wall.right} ${wall.top} V ${wall.bottom}`,
    `M ${wall.right} ${wall.bottom} H ${wall.left}`,
    `M ${wall.left} ${wall.bottom} V ${doorGaps[1].y2}`,
    `M ${wall.left} ${doorGaps[1].y1} V ${doorGaps[0].y2}`,
    `M ${wall.left} ${doorGaps[0].y1} V ${wall.top}`,
  ];

  wallsSvg.innerHTML = `
    <path d="${lines.join(" ")}" fill="none" stroke="#000" stroke-width="2" stroke-linecap="square"/>
  `;
}

function renderFixedElement(type, x, y, alt) {
  const asset = ASSET_SIZES[type];
  const el = document.createElement("div");
  el.className = "canvas-item fixed";
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.width = `${asset.w}px`;
  el.style.height = `${asset.h}px`;

  const img = document.createElement("img");
  img.src = asset.src;
  img.alt = alt;
  img.width = asset.w;
  img.height = asset.h;
  el.appendChild(img);
  fixedLayer.appendChild(el);
}

function renderFixedElements() {
  fixedLayer.innerHTML = "";
  ROOM.doors.forEach(({ x, y }) => renderFixedElement("door", x, y, "Deur"));
  const { x, y } = ROOM.presentationDesk;
  renderFixedElement("desk", x, y, "Presentatiebureau");
}

function updateCounts() {
  const tables = items.filter((i) => TABLE_TYPES.includes(i.type)).length;
  const chairs = items.filter((i) => i.type === "chair").length;
  tableCountEl.textContent = `Tafels: ${tables}`;
  chairCountEl.textContent = `Stoelen: ${chairs}`;

  if (currentExpected) {
    const tableOk = tables === currentExpected.tables;
    const chairOk = chairs === currentExpected.chairs;
    targetCountEl.textContent = `Richtlijn: ${currentExpected.tables} tafels · ${currentExpected.chairs} stoelen`;
    targetCountEl.className = `stat ${tableOk && chairOk ? "stat-ok" : "stat-warn"}`;
  } else {
    targetCountEl.textContent = selectedIds.size > 1 ? `${selectedIds.size} geselecteerd` : "";
    targetCountEl.className = "stat";
  }
}

function applyVisual(item) {
  const asset = getAsset(item.type);
  const size = getEffectiveSize(item.type, item.rotation);
  const img = item.el.querySelector("img");
  item.el.style.width = `${size.w}px`;
  item.el.style.height = `${size.h}px`;
  img.src = asset.src;
  img.width = asset.w;
  img.height = asset.h;
  img.style.position = "absolute";
  img.style.left = "50%";
  img.style.top = "50%";
  img.style.transform = `translate(-50%, -50%) rotate(${item.rotation}deg)`;
  img.style.transformOrigin = "center center";
}

function syncSelection() {
  items.forEach((i) => i.el.classList.toggle("selected", selectedIds.has(i.id)));
  updateCounts();
  const copyBtn = document.getElementById("copy-btn");
  if (copyBtn) copyBtn.disabled = selectedIds.size === 0;
}

function serializeState() {
  return {
    items: items.map(({ id, type, x, y, rotation }) => ({ id, type, x, y, rotation })),
    nextId,
    currentExpected: currentExpected ? { ...currentExpected } : null,
    selectedIds: [...selectedIds],
    roomTitle: document.getElementById("room-title").value,
    layoutSubtitle: document.getElementById("layout-subtitle").value,
  };
}

function restoreState(snapshot) {
  isRestoring = true;

  items.forEach((i) => i.el.remove());
  items = [];
  selectedIds.clear();

  snapshot.items.forEach(({ id, type, x, y, rotation }) => {
    const item = createItem(type, x, y, id, { rotation });
    if (item) items.push(item);
  });

  nextId = snapshot.nextId;
  currentExpected = snapshot.currentExpected;
  snapshot.selectedIds.forEach((id) => selectedIds.add(id));
  document.getElementById("room-title").value = snapshot.roomTitle || "";
  document.getElementById("layout-subtitle").value = snapshot.layoutSubtitle || "";

  syncSelection();
  isRestoring = false;
}

function recordHistory() {
  if (isRestoring) return;
  undoStack.push(serializeState());
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
  updateHistoryButtons();
}

function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(serializeState());
  restoreState(undoStack.pop());
  updateHistoryButtons();
}

function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(serializeState());
  restoreState(redoStack.pop());
  updateHistoryButtons();
}

function updateHistoryButtons() {
  const undoBtn = document.getElementById("undo-btn");
  const redoBtn = document.getElementById("redo-btn");
  if (undoBtn) undoBtn.disabled = undoStack.length === 0;
  if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

function clearSelection() {
  selectedIds.clear();
  syncSelection();
}

function setSelection(ids, additive = false) {
  if (!additive) selectedIds.clear();
  ids.forEach((id) => selectedIds.add(id));
  syncSelection();
}

function toggleSelection(id) {
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  syncSelection();
}

function getItemBounds(item) {
  const size = getEffectiveSize(item.type, item.rotation);
  return { x: item.x, y: item.y, w: size.w, h: size.h };
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function createItem(type, x, y, id, options = {}) {
  const { fixed = false, rotation = 0 } = options;
  const asset = getAsset(type);
  if (!asset) return null;

  const size = getEffectiveSize(type, rotation);
  const pos = fixed ? { x, y } : clampToRoom(snap(x), snap(y), size.w, size.h);

  const el = document.createElement("div");
  el.className = fixed ? "canvas-item fixed" : "canvas-item";
  el.dataset.id = id;
  el.dataset.type = type;
  el.style.left = `${pos.x}px`;
  el.style.top = `${pos.y}px`;

  const img = document.createElement("img");
  img.alt = type;
  el.appendChild(img);

  const item = { id, type, x: pos.x, y: pos.y, rotation, fixed, el };

  if (!fixed) {
    const del = document.createElement("button");
    del.className = "delete-btn";
    del.type = "button";
    del.textContent = "×";
    del.title = "Verwijderen";
    del.setAttribute("aria-label", "Verwijderen");
    del.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeItems([id]);
    });
    el.appendChild(del);
    el.addEventListener("pointerdown", (e) => onItemPointerDown(e, id));
    itemsLayer.appendChild(el);
  }

  applyVisual(item);
  return item;
}

function addItem(type, x, y, options = {}) {
  if (!getAsset(type) || type === "desk") return null;
  recordHistory();
  const id = nextId++;
  const item = createItem(type, x, y, id, options);
  if (!item || item.fixed) return item;
  items.push(item);
  setSelection([id]);
  updateCounts();
  return item;
}

function copySelected() {
  if (selectedIds.size === 0) return;

  const sources = [...selectedIds]
    .map((id) => items.find((i) => i.id === id))
    .filter(Boolean);

  recordHistory();
  const offset = GRID * 2;
  const newIds = [];

  sources.forEach((item) => {
    const id = nextId++;
    const copy = createItem(item.type, item.x + offset, item.y + offset, id, {
      rotation: item.rotation,
    });
    if (copy) {
      items.push(copy);
      newIds.push(id);
    }
  });

  if (newIds.length) setSelection(newIds);
  else undoStack.pop();
  updateCounts();
}

function placeFurniture(type) {
  if (!getAsset(type) || type === "desk") return;

  const size = getEffectiveSize(type, 0);
  let x;
  let y;

  if (selectedIds.size > 0) {
    const pivot = getSelectionPivot([...selectedIds]);
    const offset = GRID * 2;
    x = pivot.cx - size.w / 2 + offset;
    y = pivot.cy - size.h / 2 + offset;
  } else {
    x = ROOM.width / 2 - size.w / 2;
    y = ROOM.height / 2 - size.h / 2;
  }

  addItem(type, x, y);
}

const PALETTE_KEYS = {
  1: "chair",
  2: "table",
  3: "table-corner",
};

function removeItems(ids) {
  if (ids.length === 0) return;
  recordHistory();
  const removeSet = new Set(ids);
  items.filter((i) => removeSet.has(i.id)).forEach((i) => i.el.remove());
  items = items.filter((i) => !removeSet.has(i.id));
  ids.forEach((id) => selectedIds.delete(id));
  syncSelection();
}

function clearItems(skipHistory = false) {
  if (!skipHistory) recordHistory();
  items.forEach((i) => i.el.remove());
  items = [];
  selectedIds.clear();
  updateCounts();
}

function getCanvasPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function getItemCenter(item) {
  const size = getEffectiveSize(item.type, item.rotation);
  return { cx: item.x + size.w / 2, cy: item.y + size.h / 2 };
}

function getSelectionPivot(ids) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  ids.forEach((id) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const size = getEffectiveSize(item.type, item.rotation);
    minX = Math.min(minX, item.x);
    minY = Math.min(minY, item.y);
    maxX = Math.max(maxX, item.x + size.w);
    maxY = Math.max(maxY, item.y + size.h);
  });

  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

function rotateSelected() {
  if (selectedIds.size === 0) return;

  recordHistory();
  const ids = [...selectedIds];
  const pivot = getSelectionPivot(ids);
  const rad = (ROTATE_STEP * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const updates = [];

  ids.forEach((id) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const size = getEffectiveSize(item.type, item.rotation);
    const { cx, cy } = getItemCenter(item);
    const dx = cx - pivot.cx;
    const dy = cy - pivot.cy;
    const newCx = pivot.cx + dx * cos - dy * sin;
    const newCy = pivot.cy + dx * sin + dy * cos;

    updates.push({
      item,
      size,
      rawX: newCx - size.w / 2,
      rawY: newCy - size.h / 2,
    });
  });

  if (updates.length === 0) return;

  const deltaX = snap(updates[0].rawX) - updates[0].rawX;
  const deltaY = snap(updates[0].rawY) - updates[0].rawY;

  updates.forEach(({ item, size, rawX, rawY }) => {
    const pos = clampToRoom(rawX + deltaX, rawY + deltaY, size.w, size.h);

    item.x = pos.x;
    item.y = pos.y;
    item.el.style.left = `${item.x}px`;
    item.el.style.top = `${item.y}px`;
    item.rotation = (item.rotation + ROTATE_STEP) % 360;
    applyVisual(item);
  });
}

document.querySelectorAll(".palette-item").forEach((el) => {
  el.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", el.dataset.type);
    e.dataTransfer.effectAllowed = "copy";
  });
});

canvas.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
});

canvas.addEventListener("drop", (e) => {
  e.preventDefault();
  const type = e.dataTransfer.getData("text/plain");
  if (!ASSET_SIZES[type] || type === "door" || type === "desk") return;
  const pt = getCanvasPoint(e.clientX, e.clientY);
  const size = getEffectiveSize(type, 0);
  addItem(type, pt.x - size.w / 2, pt.y - size.h / 2);
});

function onItemPointerDown(e, id) {
  if (e.button !== 0) return;
  if (e.target.closest(".delete-btn")) return;
  const item = items.find((i) => i.id === id);
  if (!item || item.fixed) return;

  e.stopPropagation();
  e.preventDefault();

  if (e.shiftKey) {
    toggleSelection(id);
  } else if (!selectedIds.has(id)) {
    setSelection([id]);
  }

  const pt = getCanvasPoint(e.clientX, e.clientY);
  const movingIds = [...selectedIds];
  const startPositions = new Map(
    movingIds.map((mid) => {
      const it = items.find((i) => i.id === mid);
      return [mid, { x: it.x, y: it.y }];
    })
  );

  dragState = {
    ids: movingIds,
    startPositions,
    offsetX: pt.x - item.x,
    offsetY: pt.y - item.y,
    pointerId: e.pointerId,
    historySnapshot: serializeState(),
  };

  item.el.setPointerCapture(e.pointerId);
  item.el.addEventListener("pointermove", onItemPointerMove);
  item.el.addEventListener("pointerup", onItemPointerUp);
  item.el.addEventListener("pointercancel", onItemPointerUp);
}

function onItemPointerMove(e) {
  if (!dragState || dragState.pointerId !== e.pointerId) return;

  const anchor = items.find((i) => i.id === dragState.ids[0]);
  if (!anchor) return;

  const anchorSize = getEffectiveSize(anchor.type, anchor.rotation);
  const pt = getCanvasPoint(e.clientX, e.clientY);
  const anchorPos = clampToRoom(
    snap(pt.x - dragState.offsetX),
    snap(pt.y - dragState.offsetY),
    anchorSize.w,
    anchorSize.h
  );

  const start = dragState.startPositions.get(anchor.id);
  const dx = anchorPos.x - start.x;
  const dy = anchorPos.y - start.y;

  dragState.ids.forEach((id) => {
    const it = items.find((i) => i.id === id);
    const orig = dragState.startPositions.get(id);
    const itSize = getEffectiveSize(it.type, it.rotation);
    const pos = clampToRoom(orig.x + dx, orig.y + dy, itSize.w, itSize.h);
    it.x = pos.x;
    it.y = pos.y;
    it.el.style.left = `${it.x}px`;
    it.el.style.top = `${it.y}px`;
  });
}

function onItemPointerUp(e) {
  if (!dragState || dragState.pointerId !== e.pointerId) return;

  const changed = dragState.ids.some((id) => {
    const it = items.find((i) => i.id === id);
    const orig = dragState.startPositions.get(id);
    return it && orig && (it.x !== orig.x || it.y !== orig.y);
  });

  if (changed && !isRestoring) {
    undoStack.push(dragState.historySnapshot);
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack = [];
    updateHistoryButtons();
  }

  const item = items.find((i) => i.id === dragState.ids[0]);
  if (item) {
    item.el.releasePointerCapture(e.pointerId);
    item.el.removeEventListener("pointermove", onItemPointerMove);
    item.el.removeEventListener("pointerup", onItemPointerUp);
    item.el.removeEventListener("pointercancel", onItemPointerUp);
  }
  dragState = null;
}

function updateMarquee(x, y) {
  const left = Math.min(marqueeState.startX, x);
  const top = Math.min(marqueeState.startY, y);
  const width = Math.abs(x - marqueeState.startX);
  const height = Math.abs(y - marqueeState.startY);
  selectionBox.style.left = `${left}px`;
  selectionBox.style.top = `${top}px`;
  selectionBox.style.width = `${width}px`;
  selectionBox.style.height = `${height}px`;
  return { x: left, y: top, w: width, h: height };
}

function onMarqueePointerDown(e) {
  if (e.button !== 0) return;
  if (e.target.closest(".canvas-item")) return;

  const pt = getCanvasPoint(e.clientX, e.clientY);
  marqueeState = {
    startX: pt.x,
    startY: pt.y,
    additive: e.shiftKey,
    pointerId: e.pointerId,
  };

  if (!e.shiftKey) clearSelection();

  selectionBox.classList.remove("hidden");
  updateMarquee(pt.x, pt.y);

  canvas.setPointerCapture(e.pointerId);
  canvas.addEventListener("pointermove", onMarqueePointerMove);
  canvas.addEventListener("pointerup", onMarqueePointerUp);
  canvas.addEventListener("pointercancel", onMarqueePointerUp);
}

function onMarqueePointerMove(e) {
  if (!marqueeState || marqueeState.pointerId !== e.pointerId) return;
  const pt = getCanvasPoint(e.clientX, e.clientY);
  updateMarquee(pt.x, pt.y);
}

function onMarqueePointerUp(e) {
  if (!marqueeState || marqueeState.pointerId !== e.pointerId) return;

  const pt = getCanvasPoint(e.clientX, e.clientY);
  const rect = updateMarquee(pt.x, pt.y);

  if (rect.w > 4 || rect.h > 4) {
    const hits = items
      .filter((item) => rectsOverlap(rect, getItemBounds(item)))
      .map((item) => item.id);
    setSelection(hits, marqueeState.additive);
  }

  selectionBox.classList.add("hidden");
  canvas.releasePointerCapture(e.pointerId);
  canvas.removeEventListener("pointermove", onMarqueePointerMove);
  canvas.removeEventListener("pointerup", onMarqueePointerUp);
  canvas.removeEventListener("pointercancel", onMarqueePointerUp);
  marqueeState = null;
}

canvas.addEventListener("pointerdown", onMarqueePointerDown);

document.addEventListener("keydown", (e) => {
  const active = document.activeElement;
  if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;

  if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.size > 0) {
    removeItems([...selectedIds]);
  }

  if ((e.key === "r" || e.key === "R") && selectedIds.size > 0) {
    e.preventDefault();
    rotateSelected();
  }

  if (e.key === "Escape") clearSelection();

  const modKey = e.ctrlKey || e.metaKey;

  if (!modKey && !e.altKey && PALETTE_KEYS[e.key]) {
    e.preventDefault();
    placeFurniture(PALETTE_KEYS[e.key]);
  }

  if (modKey && !e.altKey && (e.key === "d" || e.key === "D") && selectedIds.size > 0) {
    e.preventDefault();
    copySelected();
  }

  if (modKey && !e.altKey && (e.key === "z" || e.key === "Z")) {
    e.preventDefault();
    if (e.shiftKey) redo();
    else undo();
  }

  if (modKey && !e.altKey && (e.key === "y" || e.key === "Y")) {
    e.preventDefault();
    redo();
  }

  if (modKey && !e.altKey && (e.key === "s" || e.key === "S")) {
    e.preventDefault();
    exportToCsv();
  }

  if (modKey && !e.altKey && (e.key === "i" || e.key === "I")) {
    e.preventDefault();
    triggerImportCsv();
  }
});

function setActiveTemplate(key) {
  document.querySelectorAll("[data-template]").forEach((btn) => {
    btn.classList.toggle("template-active", key !== null && btn.dataset.template === key);
  });
}

function loadTemplate(template, options = {}) {
  const { record = true, key = null } = options;
  if (record) recordHistory();
  clearItems(true);
  document.getElementById("room-title").value = template.title;
  document.getElementById("layout-subtitle").value = template.subtitle;
  currentExpected = template.expected || null;

  template.items.forEach(({ type, x, y, rotation = 0 }) => {
    const id = nextId++;
    const item = createItem(type, x, y, id, { rotation });
    if (item) items.push(item);
  });

  clearSelection();
  updateCounts();
  if (key) setActiveTemplate(key);
}

document.querySelectorAll("[data-template]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.template;
    if (TEMPLATES[key]) loadTemplate(TEMPLATES[key], { key });
  });
});

document.getElementById("clear-canvas").addEventListener("click", () => {
  if (confirm("Weet u zeker dat u alle meubels wilt verwijderen?\n\nWanden, deuren en het presentatiebureau blijven staan. U kunt dit ongedaan maken met Ctrl+Z.")) {
    clearItems();
    currentExpected = null;
    setActiveTemplate(null);
    updateCounts();
  }
});

function escapeCsvField(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function exportToCsv() {
  const state = serializeState();
  const lines = [
    `# room_title,${escapeCsvField(state.roomTitle)}`,
    `# layout_subtitle,${escapeCsvField(state.layoutSubtitle)}`,
    "type,x,y,rotation",
    ...state.items.map(({ type, x, y, rotation }) =>
      [type, x, y, rotation || 0].join(",")
    ),
  ];

  const blob = new Blob([`${lines.join("\n")}\n`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = `${(state.roomTitle || "zaalindeling").trim() || "zaalindeling"}.csv`;
  link.href = url;
  link.download = filename.replace(/[<>:"/\\|?*]+/g, "-");
  link.click();
  URL.revokeObjectURL(url);
}

function parseCsvLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("#")) {
    const meta = trimmed.slice(1).trim();
    const comma = meta.indexOf(",");
    if (comma === -1) return { meta: null };
    return { meta: [meta.slice(0, comma).trim(), meta.slice(comma + 1).trim()] };
  }

  const parts = trimmed.split(",").map((part) => part.trim());
  if (parts[0] === "type" && parts[1] === "x") return { header: true };

  const [type, x, y, rotation = "0"] = parts;
  if (!type || Number.isNaN(Number(x)) || Number.isNaN(Number(y))) return null;

  return {
    item: {
      type,
      x: Number(x),
      y: Number(y),
      rotation: Number(rotation) || 0,
    },
  };
}

function importFromCsv(text) {
  const meta = { roomTitle: "", layoutSubtitle: "" };
  const rows = [];

  text.replace(/^\uFEFF/, "").split(/\r?\n/).forEach((line) => {
    const parsed = parseCsvLine(line);
    if (!parsed) return;
    if (parsed.meta) {
      const [key, value] = parsed.meta;
      if (key === "room_title") meta.roomTitle = value;
      if (key === "layout_subtitle") meta.layoutSubtitle = value;
      return;
    }
    if (parsed.header || !parsed.item) return;
    rows.push(parsed.item);
  });

  if (rows.length === 0) {
    alert("Geen geldige meubels gevonden in het CSV-bestand.");
    return;
  }

  recordHistory();
  clearItems(true);
  document.getElementById("room-title").value = meta.roomTitle;
  document.getElementById("layout-subtitle").value = meta.layoutSubtitle;
  currentExpected = null;

  let skipped = 0;
  rows.forEach(({ type, x, y, rotation }) => {
    if (!ASSET_SIZES[type] || type === "door" || type === "desk") {
      skipped += 1;
      return;
    }
    const id = nextId++;
    const item = createItem(type, x, y, id, { rotation });
    if (item) items.push(item);
    else skipped += 1;
  });

  clearSelection();
  updateCounts();
  setActiveTemplate(null);

  if (skipped > 0) {
    alert(`${rows.length - skipped} item(s) geladen. ${skipped} item(s) overgeslagen (ongeldig type).`);
  }
}

function triggerImportCsv() {
  document.getElementById("import-csv-input").click();
}

document.getElementById("undo-btn").addEventListener("click", undo);
document.getElementById("redo-btn").addEventListener("click", redo);
document.getElementById("copy-btn").addEventListener("click", copySelected);
document.getElementById("export-csv").addEventListener("click", exportToCsv);
document.getElementById("import-csv").addEventListener("click", triggerImportCsv);
document.getElementById("import-csv-input").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      importFromCsv(String(reader.result || ""));
    } catch {
      alert("Het CSV-bestand kon niet worden gelezen.");
    }
    e.target.value = "";
  };
  reader.readAsText(file, "UTF-8");
});

renderWalls();
renderFixedElements();
loadTemplate(TEMPLATES.standaard, { record: false, key: "standaard" });
updateHistoryButtons();
