(function () {
  'use strict';
  const M = window.Mathador;
  const SYMBOL = { '+': '+', '-': '−', '*': '×', '/': '÷' };

  let game = null;
  let tokens = [];
  let usedIdx = new Set();
  let roundOver = false;
  let totalScore = 0;
  let roundNum = 1;

  const els = {};

  function $(id) { return document.getElementById(id); }

  function setMessage(text, kind) {
    els.message.textContent = text;
    els.message.className = 'message ' + (kind || '');
  }

  function lastToken() { return tokens[tokens.length - 1]; }

  function pointsPreview() {
    const s = M.scoreOf(tokens);
    if (s.mathador) return 'coup Mathador : 13 pts';
    if (s.points === 1) return '1 pt';
    if (s.points > 1) return s.points + ' pts';
    return '';
  }

  function addNumber(i) {
    if (roundOver || usedIdx.has(i)) return;
    tokens.push({ t: 'num', v: game.numbers[i], idx: i });
    usedIdx.add(i);
    render();
  }

  function canAddOp() {
    const l = lastToken();
    return !roundOver && !!l && (l.t === 'num' || l.t === 'rp');
  }

  function addOp(op) {
    if (!canAddOp()) return;
    tokens.push({ t: 'op', v: op });
    render();
  }

  function canAddLP() {
    const l = lastToken();
    return !roundOver && (!l || l.t === 'op' || l.t === 'lp');
  }

  function canAddRP() {
    const l = lastToken();
    if (roundOver || !l || (l.t !== 'num' && l.t !== 'rp')) return false;
    let open = 0;
    for (const t of tokens) {
      if (t.t === 'lp') open++;
      else if (t.t === 'rp') open--;
    }
    return open > 0;
  }

  function addLP() {
    if (!canAddLP()) return;
    tokens.push({ t: 'lp' });
    render();
  }

  function addRP() {
    if (!canAddRP()) return;
    tokens.push({ t: 'rp' });
    render();
  }

  function back() {
    if (roundOver) return;
    const t = tokens.pop();
    if (t && t.t === 'num') usedIdx.delete(t.idx);
    render();
  }

  function clearAll() {
    if (roundOver) return;
    tokens = [];
    usedIdx = new Set();
    render();
  }

  function onCheck() {
    if (roundOver || tokens.length === 0) return;
    const res = M.check(tokens, game);
    if (!res.ok) {
      setMessage('❌ ' + res.error, 'error');
      return;
    }
    if (!res.win) {
      setMessage('❌ Raté : ton calcul vaut ' + res.value + ' au lieu de ' + game.target + '.', 'error');
      return;
    }
    roundOver = true;
    totalScore += res.score.points;
    if (res.score.mathador) {
      setMessage('🎉 COUP MATHADOR ! ' + M.tokensToString(tokens) + ' = ' + game.target + ' → 13 points !', 'success');
    } else {
      setMessage('✅ Bravo ! ' + M.tokensToString(tokens) + ' = ' + game.target + ' → +' + res.score.points + ' point' + (res.score.points > 1 ? 's' : '') + '.', 'success');
    }
    render();
  }

  function onSolution() {
    roundOver = true;
    setMessage('💡 Une solution : ' + M.formatExpr(game.solution) + ' = ' + game.target + '.', 'info');
    render();
  }

  function newRound() {
    game = M.newGame();
    tokens = [];
    usedIdx = new Set();
    roundOver = false;
    els.target.textContent = game.target;
    setMessage('Manche ' + roundNum + ' — atteins la cible ' + game.target + ' !', 'info');
    render();
  }

  function render() {
    els.roundNum.textContent = roundNum;
    els.totalScore.textContent = totalScore;

    els.numbers.innerHTML = '';
    game.numbers.forEach((v, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tile' + (i === 4 ? ' big' : '') + (usedIdx.has(i) ? ' used' : '');
      b.textContent = v;
      b.disabled = roundOver || usedIdx.has(i);
      b.addEventListener('click', () => addNumber(i));
      els.numbers.appendChild(b);
    });

    els.expr.innerHTML = '';
    if (tokens.length === 0) {
      const p = document.createElement('span');
      p.className = 'placeholder';
      p.textContent = 'Compose ton calcul…';
      els.expr.appendChild(p);
    }
    for (const tk of tokens) {
      const s = document.createElement('span');
      s.className = 'chip ' + tk.t;
      s.textContent = tk.t === 'num' ? String(tk.v) : tk.t === 'op' ? SYMBOL[tk.v] : (tk.t === 'lp' ? '(' : ')');
      els.expr.appendChild(s);
    }

    const ev = tokens.length ? M.evaluate(tokens) : null;
    let txt = '';
    if (ev && ev.ok) txt = '= ' + ev.value;
    const pts = pointsPreview();
    if (pts) txt += (txt ? '   ·   ' : '') + pts;
    els.exprValue.textContent = txt;

    els.btnCheck.disabled = roundOver || tokens.length === 0;

    const padButtons = document.querySelectorAll('#pad button');
    for (const btn of padButtons) {
      const a = btn.dataset.action;
      if (a === 'op') btn.disabled = !canAddOp();
      else if (a === 'lp') btn.disabled = !canAddLP();
      else if (a === 'rp') btn.disabled = !canAddRP();
      else if (a === 'back') btn.disabled = roundOver || tokens.length === 0;
      else if (a === 'clear') btn.disabled = roundOver || tokens.length === 0;
    }
  }

  function bind() {
    const padButtons = document.querySelectorAll('#pad button');
    for (const btn of padButtons) {
      btn.addEventListener('click', () => {
        const a = btn.dataset.action;
        if (a === 'op') addOp(btn.dataset.op);
        else if (a === 'lp') addLP();
        else if (a === 'rp') addRP();
        else if (a === 'back') back();
        else if (a === 'clear') clearAll();
      });
    }
    els.btnCheck.addEventListener('click', onCheck);
    els.btnSolution.addEventListener('click', onSolution);
    els.btnNew.addEventListener('click', () => { roundNum++; newRound(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') { e.preventDefault(); back(); }
      else if (e.key === 'Escape') { clearAll(); }
      else if (e.key === 'Enter') { onCheck(); }
    });
  }

  function init() {
    els.target = $('target');
    els.numbers = $('numbers');
    els.expr = $('expr');
    els.exprValue = $('exprValue');
    els.message = $('message');
    els.totalScore = $('totalScore');
    els.roundNum = $('roundNum');
    els.btnCheck = $('btnCheck');
    els.btnSolution = $('btnSolution');
    els.btnNew = $('btnNew');
    bind();
    newRound();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
