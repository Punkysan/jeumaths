'use strict';
const assert = require('assert');
const M = require('./mathador.js');

function strToTokens(s) {
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c >= '0' && c <= '9') {
      let j = i;
      while (j < s.length && s[j] >= '0' && s[j] <= '9') j++;
      tokens.push({ t: 'num', v: parseInt(s.slice(i, j), 10) });
      i = j;
    } else if (c === '+' || c === '-' || c === '*' || c === '/') {
      tokens.push({ t: 'op', v: c });
      i++;
    } else if (c === '(') { tokens.push({ t: 'lp' }); i++; }
    else if (c === ')') { tokens.push({ t: 'rp' }); i++; }
    else { i++; }
  }
  return tokens;
}

let passed = 0;
function ok(cond, msg) { assert.ok(cond, msg); passed++; }

// --- evaluate ---
ok(M.evaluate(strToTokens('3+4*2')).value === 11, 'priorité * sur +');
ok(M.evaluate(strToTokens('(3+4)*2')).value === 14, 'parenthèses');
ok(M.evaluate(strToTokens('24/3+5')).value === 13, 'division prioritaire');
ok(M.evaluate(strToTokens('2*3*4')).value === 24, 'associativité');
ok(!M.evaluate(strToTokens('7/2')).ok, 'division non exacte interdite');
ok(!M.evaluate(strToTokens('3-5')).ok, 'résultat négatif interdit');
ok(!M.evaluate(strToTokens('5-5')).ok, 'zéro interdit comme intermédiaire');
ok(!M.evaluate(strToTokens('10/0')).ok, 'division par zéro interdite');
ok(!M.evaluate(strToTokens('3+')).ok, 'expression incomplète');
ok(!M.evaluate(strToTokens('(3+4')).ok, 'parenthèse non fermée');
ok(!M.evaluate(strToTokens('3+4)')).ok, 'parenthèse en trop');
ok(!M.evaluate(strToTokens('3++4')).ok, 'double opérateur');
ok(!M.evaluate(strToTokens('')).ok, 'vide');
ok(M.evaluate(strToTokens('((2+3)*(4+1))')).value === 25, 'parenthèses imbriquées');
ok(!M.evaluate(strToTokens('(5-2)-3')).ok, 'résultat final nul interdit aussi');

// --- barème ---
let s = M.scoreOf(strToTokens('15*6-12+3'));
ok(s.points === 4 && !s.mathador, '15×6−12+3 = 4 pts (exemple officiel)');
s = M.scoreOf(strToTokens('(24/3+5)*4'));
ok(s.points === 5 && !s.mathador, '(24÷3+5)×4 = 5 pts (exemple officiel)');
s = M.scoreOf(strToTokens('4*3'));
ok(s.points === 1, '4×3 = 1 pt');
s = M.scoreOf(strToTokens('7'));
ok(s.points === 0, 'nombre seul = 0 pt');

// --- contraintes de tirage ---
for (let k = 0; k < 5000; k++) {
  const d = M.drawNumbers();
  ok(d.numbers.length === 5, '5 nombres');
  const cnt = {};
  for (const v of d.small) cnt[v] = (cnt[v] || 0) + 1;
  for (let v = 1; v <= 4; v++) ok((cnt[v] || 0) <= 2, '1-4 max 2 fois');
  for (let v = 5; v <= 9; v++) ok((cnt[v] || 0) <= 1, '5-9 max 1 fois');
  ok(d.big >= 10 && d.big <= 99, 'grand nombre 10-99');
  ok(d.numbers[4] === d.big, 'grand nombre en 5e position');
}

// --- parties générées : solvables, solution valide, nombres tous utilisés ---
let mathadorCount = 0;
for (let k = 0; k < 300; k++) {
  const g = M.newGame();
  ok(g.target >= 1 && g.target <= 99, 'cible 1-99');
  const toks = strToTokens(g.solution);
  const ev = M.evaluate(toks);
  ok(ev.ok, 'solution évaluable : ' + g.solution);
  ok(ev.value === g.target, 'solution = cible (' + g.solution + ' = ' + ev.value + ' vs ' + g.target + ')');
  const used = toks.filter(t => t.t === 'num').map(t => t.v).sort((a, b) => a - b);
  assert.deepStrictEqual(used, g.numbers.slice().sort((a, b) => a - b));
  passed++;
  const res = M.check(toks, g);
  ok(res.ok && res.win, 'check() valide la solution');
  if (g.mathadorPossible) {
    mathadorCount++;
    ok(res.score.mathador && res.score.points === 13, 'solution coup Mathador = 13 pts');
  }
}
console.log('tirages avec coup Mathador possible : ' + mathadorCount + '/300');

// --- check() : cas d'erreur ---
const g0 = { numbers: [2, 3, 4, 5, 25], target: 30 };
ok(M.check(strToTokens('2+3'), g0).ok && !M.check(strToTokens('2+3'), g0).win, '5 != 30 raté');
ok(!M.check(strToTokens('2'), g0).ok, 'pas d’opération -> invalide');
ok(!M.check(strToTokens('2+2+3'), g0).ok, 'nombre réutilisé -> invalide');
ok(!M.check(strToTokens('2-5'), g0).ok, 'intermédiaire négatif -> invalide');
const g1 = { numbers: [2, 3, 4, 5, 25], target: 30 };
ok(M.check(strToTokens('25+5'), g1).win, '25+5 = 30 -> gagné');
ok(M.check(strToTokens('25+5'), g1).score.points === 1, '+ = 1 pt');

// --- coup Mathador manuel : (5-1)*... cherchons un exemple concret ---
// nombres 1,2,3,4,10 : (10-4)*(3+2)+... non. test via coupMathadorMap :
const cm = M.coupMathadorMap([1, 2, 3, 4, 10]);
ok(cm.size > 0, 'coup Mathador existe pour 1,2,3,4,10');
for (const [t, expr] of cm) {
  ok(M.evaluate(strToTokens(expr)).value === t, 'expr CM valide: ' + expr);
  ok(M.scoreOf(strToTokens(expr)).mathador, 'expr CM = coup Mathador: ' + expr);
}

// --- formatExpr / tokensToString ---
ok(M.formatExpr('((5-1)*4)').indexOf('*') === -1, 'plus de * dans formatExpr: ' + M.formatExpr('((5-1)*4)'));
ok(M.formatExpr('(5*4)') === '5×4', 'parens externes retirées + symbole ×');
ok(M.formatExpr('(5*4)+3') === '(5×4)+3', 'parens internes gardées');
ok(M.tokensToString(strToTokens('5*4')).trim() === '5 × 4', 'tokensToString');

// --- perf ---
const t0 = Date.now();
for (let k = 0; k < 200; k++) M.newGame();
console.log('200 tirages générés en ' + (Date.now() - t0) + ' ms');

console.log('\nOK — ' + passed + ' assertions passées');
