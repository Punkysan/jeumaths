(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.Mathador = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  const OPS = ['+', '-', '*', '/'];
  const OP_POINTS = { '+': 1, '-': 2, '*': 1, '/': 3 };
  const DISPLAY = { '+': '+', '-': '−', '*': '×', '/': '÷' };
  const MATHADOR_POINTS = 13;

  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function permutations(arr) {
    if (arr.length <= 1) return [arr.slice()];
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = arr.slice(0, i).concat(arr.slice(i + 1));
      for (const p of permutations(rest)) out.push([arr[i]].concat(p));
    }
    return out;
  }

  function popcount(mask) {
    let c = 0;
    while (mask) { mask &= mask - 1; c++; }
    return c;
  }

  function drawNumbers(rng) {
    rng = rng || Math.random;
    const pool = [];
    for (let n = 1; n <= 9; n++) {
      const copies = n <= 4 ? 2 : 1;
      for (let i = 0; i < copies; i++) pool.push(n);
    }
    const small = shuffle(pool, rng).slice(0, 4).sort((a, b) => a - b);
    const big = 10 + Math.floor(rng() * 90);
    return { numbers: small.concat([big]), small: small, big: big };
  }

  function applyOp(op, a, b) {
    switch (op) {
      case '+':
        return { ok: true, value: a + b };
      case '-':
        return a - b > 0
          ? { ok: true, value: a - b }
          : { ok: false, error: 'résultat intermédiaire non strictement positif' };
      case '*':
        return { ok: true, value: a * b };
      case '/':
        if (b === 0) return { ok: false, error: 'division par zéro' };
        if (a % b !== 0) return { ok: false, error: 'division non exacte' };
        return { ok: true, value: a / b };
      default:
        return { ok: false, error: 'opérateur inconnu' };
    }
  }

  function evalTrees(nums, ops) {
    if (nums.length === 1) return [{ ok: true, value: nums[0], expr: String(nums[0]) }];
    const out = [];
    for (let k = 1; k < nums.length; k++) {
      const lefts = evalTrees(nums.slice(0, k), ops.slice(0, k - 1));
      const rights = evalTrees(nums.slice(k), ops.slice(k));
      const op = ops[k - 1];
      for (const l of lefts) {
        for (const r of rights) {
          const res = applyOp(op, l.value, r.value);
          if (res.ok) out.push({ ok: true, value: res.value, expr: '(' + l.expr + op + r.expr + ')' });
        }
      }
    }
    return out;
  }

  function coupMathadorMap(numbers) {
    const map = new Map();
    const perms = permutations(numbers);
    const opPerms = permutations(OPS);
    for (const p of perms) {
      for (const ops of opPerms) {
        for (const t of evalTrees(p, ops)) {
          if (t.value >= 1 && t.value <= 99 && !map.has(t.value)) map.set(t.value, t.expr);
        }
      }
    }
    return map;
  }

  function reachableSubsetMap(numbers) {
    const n = numbers.length;
    const size = 1 << n;
    const maps = new Array(size).fill(null);
    for (let i = 0; i < n; i++) {
      const m = new Map();
      m.set(numbers[i], String(numbers[i]));
      maps[1 << i] = m;
    }
    for (let mask = 1; mask < size; mask++) {
      if (maps[mask]) continue;
      const m = new Map();
      for (let sub = (mask - 1) & mask; sub > 0; sub = (sub - 1) & mask) {
        const a = sub;
        const b = mask ^ sub;
        if (a > b) continue;
        const ma = maps[a];
        const mb = maps[b];
        if (!ma || !mb) continue;
        for (const pairA of ma) {
          const va = pairA[0], ea = pairA[1];
          for (const pairB of mb) {
            const vb = pairB[0], eb = pairB[1];
            const add = (val, expr) => {
              if (Number.isInteger(val) && val > 0 && !m.has(val)) m.set(val, expr);
            };
            add(va + vb, '(' + ea + '+' + eb + ')');
            if (va - vb > 0) add(va - vb, '(' + ea + '-' + eb + ')');
            if (vb - va > 0) add(vb - va, '(' + eb + '-' + ea + ')');
            add(va * vb, '(' + ea + '*' + eb + ')');
            if (vb !== 0 && va % vb === 0) add(va / vb, '(' + ea + '/' + eb + ')');
            if (va !== 0 && vb % va === 0) add(vb / va, '(' + eb + '/' + ea + ')');
          }
        }
      }
      maps[mask] = m;
    }
    const all = new Map();
    for (let mask = 1; mask < size; mask++) {
      if (popcount(mask) < 2) continue;
      for (const entry of maps[mask]) {
        if (!all.has(entry[0])) all.set(entry[0], entry[1]);
      }
    }
    return all;
  }

  function newGame(rng) {
    rng = rng || Math.random;
    const drawn = drawNumbers(rng);
    const numbers = drawn.numbers;
    const cm = coupMathadorMap(numbers);
    const cmTargets = [];
    for (const v of cm.keys()) {
      if (v >= 1 && v <= 99) cmTargets.push(v);
    }
    let target, solution, mathadorPossible = false;
    if (cmTargets.length > 0) {
      target = cmTargets[Math.floor(rng() * cmTargets.length)];
      solution = cm.get(target);
      mathadorPossible = true;
    } else {
      const reach = reachableSubsetMap(numbers);
      const cands = [];
      for (const v of reach.keys()) {
        if (v >= 1 && v <= 99) cands.push(v);
      }
      target = cands[Math.floor(rng() * cands.length)];
      solution = reach.get(target);
    }
    return { numbers: numbers, target: target, solution: solution, mathadorPossible: mathadorPossible };
  }

  function evaluate(tokens) {
    let pos = 0;
    function peek() { return tokens[pos]; }
    function parseExpr() {
      let left = parseTerm();
      if (!left.ok) return left;
      while (peek() && peek().t === 'op' && (peek().v === '+' || peek().v === '-')) {
        const op = tokens[pos].v;
        pos++;
        const right = parseTerm();
        if (!right.ok) return right;
        left = applyOp(op, left.value, right.value);
        if (!left.ok) return left;
      }
      return left;
    }
    function parseTerm() {
      let left = parseFactor();
      if (!left.ok) return left;
      while (peek() && peek().t === 'op' && (peek().v === '*' || peek().v === '/')) {
        const op = tokens[pos].v;
        pos++;
        const right = parseFactor();
        if (!right.ok) return right;
        left = applyOp(op, left.value, right.value);
        if (!left.ok) return left;
      }
      return left;
    }
    function parseFactor() {
      const tk = peek();
      if (!tk) return { ok: false, error: 'expression incomplète' };
      if (tk.t === 'num') {
        pos++;
        return { ok: true, value: tk.v };
      }
      if (tk.t === 'lp') {
        pos++;
        const r = parseExpr();
        if (!r.ok) return r;
        if (!peek() || peek().t !== 'rp') return { ok: false, error: 'parenthèse fermante manquante' };
        pos++;
        return r;
      }
      return { ok: false, error: 'expression invalide' };
    }
    const res = parseExpr();
    if (!res.ok) return res;
    if (pos !== tokens.length) return { ok: false, error: 'expression invalide' };
    return res;
  }

  function scoreOf(tokens) {
    const numCount = tokens.filter(t => t.t === 'num').length;
    const ops = tokens.filter(t => t.t === 'op').map(t => t.v);
    if (ops.length === 0) return { points: 0, mathador: false };
    const mathador = numCount === 5 && OPS.every(op => ops.indexOf(op) !== -1);
    if (mathador) return { points: MATHADOR_POINTS, mathador: true };
    let points = 0;
    for (const op of ops) points += OP_POINTS[op];
    return { points: points, mathador: false };
  }

  function check(tokens, game) {
    const used = {};
    for (const t of tokens) {
      if (t.t === 'num') used[t.v] = (used[t.v] || 0) + 1;
    }
    const drawn = {};
    for (const v of game.numbers) drawn[v] = (drawn[v] || 0) + 1;
    for (const v in used) {
      if ((drawn[v] || 0) < used[v]) return { ok: false, error: 'chaque nombre ne peut être utilisé qu’une fois' };
    }
    const opCount = tokens.filter(t => t.t === 'op').length;
    if (opCount === 0) return { ok: false, error: 'il faut au moins une opération' };
    const ev = evaluate(tokens);
    if (!ev.ok) return { ok: false, error: ev.error || 'calcul invalide' };
    const score = scoreOf(tokens);
    if (ev.value !== game.target) return { ok: true, win: false, value: ev.value, score: score };
    return { ok: true, win: true, value: ev.value, score: score };
  }

  function tokensToString(tokens) {
    return tokens.map(t => {
      if (t.t === 'num') return String(t.v);
      if (t.t === 'op') return DISPLAY[t.v] || t.v;
      return t.t === 'lp' ? '(' : ')';
    }).join(' ');
  }

  function formatExpr(s) {
    let out = s.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−');
    if (out.charAt(0) === '(' && out.charAt(out.length - 1) === ')') {
      let depth = 0;
      let wraps = true;
      for (let i = 0; i < out.length - 1; i++) {
        if (out[i] === '(') depth++;
        else if (out[i] === ')') depth--;
        if (depth === 0) { wraps = false; break; }
      }
      if (wraps) out = out.slice(1, -1);
    }
    return out;
  }

  return {
    OPS: OPS,
    OP_POINTS: OP_POINTS,
    MATHADOR_POINTS: MATHADOR_POINTS,
    drawNumbers: drawNumbers,
    newGame: newGame,
    evaluate: evaluate,
    scoreOf: scoreOf,
    check: check,
    applyOp: applyOp,
    coupMathadorMap: coupMathadorMap,
    reachableSubsetMap: reachableSubsetMap,
    tokensToString: tokensToString,
    formatExpr: formatExpr
  };
});
