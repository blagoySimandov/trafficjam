import K from "splaytree";
import { orient2d as X } from "robust-predicates";
import Y from "tinyqueue";
const U = 0, _ = 1, z = 2, G = 3, R = 0, y = 1, g = 2, T = 3;
function P(n, t, e) {
  t === null ? (n.inOut = !1, n.otherInOut = !0) : (n.isSubject === t.isSubject ? (n.inOut = !t.inOut, n.otherInOut = t.otherInOut) : (n.inOut = !t.otherInOut, n.otherInOut = t.isVertical() ? !t.inOut : t.inOut), t && (n.prevInResult = !F(t, e) || t.isVertical() ? t.prevInResult : t)), F(n, e) ? n.resultTransition = J(n, e) : n.resultTransition = 0;
}
function F(n, t) {
  switch (n.type) {
    case U:
      switch (t) {
        case R:
          return !n.otherInOut;
        case y:
          return n.otherInOut;
        case g:
          return n.isSubject && n.otherInOut || !n.isSubject && !n.otherInOut;
        case T:
          return !0;
      }
      break;
    case z:
      return t === R || t === y;
    case G:
      return t === g;
    case _:
      return !1;
  }
  return !1;
}
function J(n, t) {
  let e = !n.inOut, i = !n.otherInOut, o;
  switch (t) {
    case R:
      o = e && i;
      break;
    case y:
      o = e || i;
      break;
    case T:
      o = e !== i;
      break;
    case g:
      n.isSubject ? o = e && !i : o = i && !e;
      break;
  }
  return o ? 1 : -1;
}
class S {
  /**
   * Sweepline event
   *
   * @class {SweepEvent}
   * @param {Position}        point
   * @param {boolean}         left
   * @param {SweepEvent=}     otherEvent
   * @param {boolean}         isSubject
   * @param {EdgeType}        edgeType
   */
  constructor(t, e, i, o, r) {
    this.left = e, this.point = t, this.otherEvent = i, this.isSubject = o ?? !1, this.type = r || U, this.inOut = !1, this.otherInOut = !1, this.prevInResult = null, this.resultTransition = 0, this.otherPos = -1, this.outputContourId = -1, this.isExteriorRing = !0;
  }
  /**
   * @param  {Position}  p
   * @return {boolean}
   */
  isBelow(t) {
    const e = this.point, i = this.otherEvent.point;
    return this.left ? (e[0] - t[0]) * (i[1] - t[1]) - (i[0] - t[0]) * (e[1] - t[1]) > 0 : (i[0] - t[0]) * (e[1] - t[1]) - (e[0] - t[0]) * (i[1] - t[1]) > 0;
  }
  /**
   * @param  {Position}  p
   * @return {boolean}
   */
  isAbove(t) {
    return !this.isBelow(t);
  }
  /**
   * @return {boolean}
   */
  isVertical() {
    return this.point[0] === this.otherEvent.point[0];
  }
  /**
   * Does event belong to result?
   * @return {boolean}
   */
  get inResult() {
    return this.resultTransition !== 0;
  }
  clone() {
    const t = new S(
      this.point,
      this.left,
      this.otherEvent,
      this.isSubject,
      this.type
    );
    return t.contourId = this.contourId, t.resultTransition = this.resultTransition, t.prevInResult = this.prevInResult, t.isExteriorRing = this.isExteriorRing, t.inOut = this.inOut, t.otherInOut = this.otherInOut, t;
  }
}
function v(n, t) {
  return n[0] === t[0] ? n[1] === t[1] : !1;
}
function A(n, t, e) {
  const i = X(n[0], n[1], t[0], t[1], e[0], e[1]);
  return i > 0 ? -1 : i < 0 ? 1 : 0;
}
function w(n, t) {
  const e = n.point, i = t.point;
  return e[0] > i[0] ? 1 : e[0] < i[0] ? -1 : e[1] !== i[1] ? e[1] > i[1] ? 1 : -1 : W(n, t, e);
}
function W(n, t, e, i) {
  return n.left !== t.left ? n.left ? 1 : -1 : A(e, n.otherEvent.point, t.otherEvent.point) !== 0 ? n.isBelow(t.otherEvent.point) ? -1 : 1 : !n.isSubject && t.isSubject ? 1 : -1;
}
function m(n, t, e) {
  const i = new S(t, !1, n, n.isSubject), o = new S(t, !0, n.otherEvent, n.isSubject);
  return v(n.point, n.otherEvent.point) && console.warn("what is that, a collapsed segment?", n), i.contourId = o.contourId = n.contourId, w(o, n.otherEvent) > 0 && (n.otherEvent.left = !0, o.left = !1), n.otherEvent.otherEvent = o, n.otherEvent = i, e.push(o), e.push(i), e;
}
function k(n, t) {
  return n[0] * t[1] - n[1] * t[0];
}
function M(n, t) {
  return n[0] * t[0] + n[1] * t[1];
}
function Z(n, t, e, i, o) {
  const r = [t[0] - n[0], t[1] - n[1]], s = [i[0] - e[0], i[1] - e[1]];
  function l(d, O, B) {
    return [
      d[0] + O * B[0],
      d[1] + O * B[1]
    ];
  }
  const c = [e[0] - n[0], e[1] - n[1]];
  let u = k(r, s), f = u * u;
  const p = M(r, r);
  if (f > 0) {
    const d = k(c, s) / u;
    if (d < 0 || d > 1)
      return null;
    const O = k(c, r) / u;
    return O < 0 || O > 1 ? null : d === 0 || d === 1 ? [l(n, d, r)] : O === 0 || O === 1 ? [l(e, O, s)] : [l(n, d, r)];
  }
  if (u = k(c, r), f = u * u, f > 0)
    return null;
  const h = M(r, c) / p, E = h + M(r, s) / p, a = Math.min(h, E), I = Math.max(h, E);
  return a <= 1 && I >= 0 ? a === 1 ? [l(n, a > 0 ? a : 0, r)] : I === 0 ? [l(n, I < 1 ? I : 1, r)] : [
    l(n, a > 0 ? a : 0, r),
    l(n, I < 1 ? I : 1, r)
  ] : null;
}
function x(n, t, e) {
  const i = Z(
    n.point,
    n.otherEvent.point,
    t.point,
    t.otherEvent.point
  ), o = i ? i.length : 0;
  if (o === 0 || o === 1 && (v(n.point, t.point) || v(n.otherEvent.point, t.otherEvent.point)) || o === 2 && n.isSubject === t.isSubject)
    return 0;
  if (o === 1)
    return !v(n.point, i[0]) && !v(n.otherEvent.point, i[0]) && m(n, i[0], e), !v(t.point, i[0]) && !v(t.otherEvent.point, i[0]) && m(t, i[0], e), 1;
  const r = [];
  let s = !1, l = !1;
  return v(n.point, t.point) ? s = !0 : w(n, t) === 1 ? r.push(t, n) : r.push(n, t), v(n.otherEvent.point, t.otherEvent.point) ? l = !0 : w(n.otherEvent, t.otherEvent) === 1 ? r.push(t.otherEvent, n.otherEvent) : r.push(n.otherEvent, t.otherEvent), s && l || s ? (t.type = _, n.type = t.inOut === n.inOut ? z : G, s && !l && m(r[1].otherEvent, r[0].point, e), 2) : l ? (m(r[0], r[1].point, e), 3) : r[0] !== r[3].otherEvent ? (m(r[0], r[1].point, e), m(r[1], r[2].point, e), 3) : (m(r[0], r[1].point, e), m(r[3].otherEvent, r[2].point, e), 3);
}
function $(n, t) {
  if (n === t) return 0;
  if (A(n.point, n.otherEvent.point, t.point) !== 0 || A(n.point, n.otherEvent.point, t.otherEvent.point) !== 0)
    return v(n.point, t.point) ? n.isBelow(t.otherEvent.point) ? -1 : 1 : n.point[0] === t.point[0] ? n.point[1] < t.point[1] ? -1 : 1 : w(n, t) === 1 ? t.isAbove(n.point) ? -1 : 1 : n.isBelow(t.point) ? -1 : 1;
  if (n.isSubject === t.isSubject) {
    let e = n.point, i = t.point;
    if (e[0] === i[0] && e[1] === i[1])
      return e = n.otherEvent.point, i = t.otherEvent.point, e[0] === i[0] && e[1] === i[1] ? 0 : (n.contourId ?? 0) > (t.contourId ?? 0) ? 1 : -1;
  } else
    return n.isSubject ? -1 : 1;
  return w(n, t) === 1 ? 1 : -1;
}
function Q(n, t, e, i, o, r) {
  const s = new K($), l = [], c = Math.min(i[2], o[2]);
  let u, f, p;
  for (; n.length !== 0; ) {
    let h = n.pop();
    if (l.push(h), r === R && h.point[0] > c || r === g && h.point[0] > i[2])
      break;
    if (h.left) {
      f = u = s.insert(h), p = s.minNode(), u !== p ? u = s.prev(u) : u = null, f = s.next(f);
      const E = u ? u.key : null;
      let a;
      if (P(h, E, r), f && x(h, f.key, n) === 2 && (P(h, E, r), P(f.key, h, r)), u && x(u.key, h, n) === 2) {
        let I = u;
        I !== p ? I = s.prev(I) : I = null, a = I ? I.key : null, P(E, a, r), P(h, E, r);
      }
    } else
      h = h.otherEvent, f = u = s.find(h), u && f && (u !== p ? u = s.prev(u) : u = null, f = s.next(f), s.remove(h), f && u && x(u.key, f.key, n));
  }
  return l;
}
class H {
  /**
   * Contour
   *
   * @class {Contour}
   */
  constructor() {
    this.points = [], this.holeIds = [], this.holeOf = null, this.depth = null;
  }
  isExterior() {
    return this.holeOf == null;
  }
}
function b(n) {
  let t, e, i, o, r;
  const s = [];
  for (e = 0, i = n.length; e < i; e++)
    t = n[e], (t.left && t.inResult || !t.left && t.otherEvent.inResult) && s.push(t);
  let l = !1;
  for (; !l; )
    for (l = !0, e = 0, i = s.length; e < i; e++)
      e + 1 < i && w(s[e], s[e + 1]) === 1 && (o = s[e], s[e] = s[e + 1], s[e + 1] = o, l = !1);
  for (e = 0, i = s.length; e < i; e++)
    t = s[e], t.otherPos = e;
  for (e = 0, i = s.length; e < i; e++)
    t = s[e], t.left || (r = t.otherPos, t.otherPos = t.otherEvent.otherPos, t.otherEvent.otherPos = r);
  return s;
}
function q(n, t, e, i) {
  let o = n + 1, r = t[n].point, s;
  const l = t.length;
  for (o < l && (s = t[o].point); o < l && s[0] === r[0] && s[1] === r[1]; ) {
    if (e[o])
      o++;
    else
      return o;
    o < l && (s = t[o].point);
  }
  for (o = n - 1; e[o] && o > i; )
    o--;
  return o;
}
function tt(n, t, e) {
  const i = new H();
  if (n.prevInResult != null) {
    const o = n.prevInResult, r = o.outputContourId;
    if (o.resultTransition > 0) {
      const l = t[r];
      if (l.holeOf != null) {
        const c = l.holeOf;
        t[c].holeIds.push(e), i.holeOf = c, i.depth = t[r].depth;
      } else
        t[r].holeIds.push(e), i.holeOf = r, i.depth = t[r].depth + 1;
    } else
      i.holeOf = null, i.depth = t[r].depth;
  } else
    i.holeOf = null, i.depth = 0;
  return i;
}
function nt(n) {
  let t, e;
  const i = b(n), o = {}, r = [];
  for (t = 0, e = i.length; t < e; t++) {
    if (o[t])
      continue;
    const s = r.length, l = tt(i[t], r, s), c = (h) => {
      o[h] = !0, h < i.length && i[h] && (i[h].outputContourId = s);
    };
    let u = t, f = t;
    const p = i[t].point;
    for (l.points.push(p); c(u), u = i[u].otherPos, c(u), l.points.push(i[u].point), u = q(u, i, o, f), !(u == f || u >= i.length || !i[u]); )
      ;
    r.push(l);
  }
  return r;
}
const L = Math.max, V = Math.min;
let N = 0;
function D(n, t, e, i, o, r) {
  let s, l, c, u, f, p;
  for (s = 0, l = n.length - 1; s < l; s++) {
    if (c = n[s], u = n[s + 1], f = new S(c, !1, void 0, t), p = new S(u, !1, f, t), f.otherEvent = p, c[0] === u[0] && c[1] === u[1])
      continue;
    f.contourId = p.contourId = e, r || (f.isExteriorRing = !1, p.isExteriorRing = !1), w(f, p) > 0 ? p.left = !0 : f.left = !0;
    const h = c[0], E = c[1];
    o[0] = V(o[0], h), o[1] = V(o[1], E), o[2] = L(o[2], h), o[3] = L(o[3], E), i.push(f), i.push(p);
  }
}
function et(n, t, e, i, o) {
  const r = new Y(void 0, w);
  let s, l, c, u, f, p;
  for (c = 0, u = n.length; c < u; c++)
    for (s = n[c], f = 0, p = s.length; f < p; f++)
      l = f === 0, l && N++, D(
        s[f],
        !0,
        N,
        r,
        e,
        l
      );
  for (c = 0, u = t.length; c < u; c++)
    for (s = t[c], f = 0, p = s.length; f < p; f++)
      l = f === 0, o === g && (l = !1), l && N++, D(
        s[f],
        !1,
        N,
        r,
        i,
        l
      );
  return r;
}
const C = [];
function it(n, t, e) {
  let i = null;
  return n.length * t.length === 0 && (e === R ? i = C : e === g ? i = n : (e === y || e === T) && (i = n.length === 0 ? t : n)), i;
}
function rt(n, t, e, i, o) {
  let r = null;
  return (e[0] > i[2] || i[0] > e[2] || e[1] > i[3] || i[1] > e[3]) && (o === R ? r = C : o === g ? r = n : (o === y || o === T) && (r = n.concat(t))), r;
}
function j(n, t, e) {
  let i = n, o = t;
  typeof n[0][0][0] == "number" && (i = [n]), typeof t[0][0][0] == "number" && (o = [t]);
  let r = it(i, o, e);
  if (r)
    return r === C ? null : r;
  const s = [1 / 0, 1 / 0, -1 / 0, -1 / 0], l = [1 / 0, 1 / 0, -1 / 0, -1 / 0], c = et(i, o, s, l, e);
  if (r = rt(i, o, s, l, e), r)
    return r === C ? null : r;
  const u = Q(
    c,
    i,
    o,
    s,
    l,
    e
  ), f = nt(u), p = [];
  for (let h = 0; h < f.length; h++) {
    let E = f[h];
    if (E.isExterior()) {
      let a = [E.points];
      for (let I = 0; I < E.holeIds.length; I++) {
        let d = E.holeIds[I];
        a.push(f[d].points);
      }
      p.push(a);
    }
  }
  return p;
}
function lt(n, t) {
  return j(n, t, y);
}
function ft(n, t) {
  return j(n, t, g);
}
function ht(n, t) {
  return j(n, t, T);
}
function ct(n, t) {
  return j(n, t, R);
}
const pt = { UNION: y, DIFFERENCE: g, INTERSECTION: R, XOR: T };
export {
  ft as diff,
  ct as intersection,
  pt as operations,
  lt as union,
  ht as xor
};
