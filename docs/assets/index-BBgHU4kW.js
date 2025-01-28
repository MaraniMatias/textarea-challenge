(function () {
  const n = document.createElement("link").relList;
  if (n && n.supports && n.supports("modulepreload")) return;
  for (const o of document.querySelectorAll('link[rel="modulepreload"]')) s(o);
  new MutationObserver((o) => {
    for (const l of o)
      if (l.type === "childList")
        for (const i of l.addedNodes) i.tagName === "LINK" && i.rel === "modulepreload" && s(i);
  }).observe(document, { childList: !0, subtree: !0 });
  function t(o) {
    const l = {};
    return (
      o.integrity && (l.integrity = o.integrity),
      o.referrerPolicy && (l.referrerPolicy = o.referrerPolicy),
      o.crossOrigin === "use-credentials"
        ? (l.credentials = "include")
        : o.crossOrigin === "anonymous"
          ? (l.credentials = "omit")
          : (l.credentials = "same-origin"),
      l
    );
  }
  function s(o) {
    if (o.ep) return;
    o.ep = !0;
    const l = t(o);
    fetch(o.href, l);
  }
})();
const d = document.getElementById("textarea"),
  I = document.getElementById("textarea-mirror"),
  g = document.getElementById("colorPicker"),
  T = document.getElementById("applyColor"),
  w = document.getElementById("clearColors"),
  M = document.getElementById("boldButton"),
  O = document.getElementById("italicButton"),
  $ = document.getElementById("clearStyles"),
  h = document.getElementById("tooltip");
let L = d.value;
function v(e) {
  const n = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return e.replace(/[&<>"']/g, (t) => n[t]);
}
function P(e, n) {
  let t = 0;
  for (; t < e.length && t < n.length && e[t] === n[t]; ) t++;
  let s = e.length - 1,
    o = n.length - 1;
  for (; s >= t && o >= t && e[s] === n[o]; ) s--, o--;
  return t > s && t > o
    ? null
    : s < t
      ? { type: "insert", index: t, length: o - t + 1 }
      : o < t
        ? { type: "delete", index: t, length: s - t + 1 }
        : [
            { type: "delete", index: t, length: s - t + 1 },
            { type: "insert", index: t, length: o - t + 1 },
          ];
}
let r = [];
function b(e) {
  if (e.length === 0) return e;
  e.sort((o, l) => o.start - l.start);
  let n = [],
    t = e[0],
    s = e.length;
  for (let o = 1; o < s; o++) {
    const l = e[o];
    t.color === l.color && t.bold === l.bold && t.italic === l.italic && t.end === l.start
      ? (t.end = l.end)
      : (n.push(t), (t = l));
  }
  return (
    n.push(t),
    (n = n.reduce((o, l) => {
      let i = o.at(-1);
      return (
        i && i.end < l.start && o.push({ start: i.end, end: l.start, color: null, bold: null, italic: null }),
        o.push(l),
        o
      );
    }, [])),
    (e = n),
    n
  );
}
function A(e, n, t, s) {
  if (t === s) return;
  let o = [],
    l = !1;
  r.forEach((i) => {
    if (i.end <= t || i.start >= s) o.push(i);
    else {
      (l = !0), i.start < t && o.push({ ...i, end: t }), i.end > s && o.push({ ...i, start: s });
      const a = Math.max(i.start, t),
        c = Math.min(i.end, s),
        u = n,
        f = i.bold,
        x = i.italic;
      o.push({ start: a, end: c, color: u, bold: f, italic: x });
    }
  }),
    l || o.push({ start: t, end: s, color: n, bold: null, italic: null }),
    (r = b(o));
}
function C(e, n, t) {
  if (n === t) return;
  let s = [],
    o = !1;
  r.forEach((l) => {
    if (l.end <= n || l.start >= t) s.push(l);
    else {
      (o = !0), l.start < n && s.push({ ...l, end: n }), l.end > t && s.push({ ...l, start: t });
      const i = Math.max(l.start, n),
        a = Math.min(l.end, t);
      let { bold: c, italic: u, color: f } = l;
      e === "bold" ? (c = !c) : e === "italic" && (u = !u), s.push({ start: i, end: a, color: f, bold: c, italic: u });
    }
  }),
    o || s.push({ start: n, end: t, color: null, bold: e === "bold" ? !0 : null, italic: e === "italic" ? !0 : null }),
    (r = b(s));
}
function k(e, n) {
  if (e === n) return;
  let t = [];
  r.forEach((s) => {
    if (s.end <= e || s.start >= n) t.push(s);
    else {
      s.start < e && t.push({ ...s, end: e }), s.end > n && t.push({ ...s, start: n });
      const o = Math.max(s.start, e),
        l = Math.min(s.end, n);
      t.push({ start: o, end: l, color: null, bold: s.bold, italic: s.italic });
    }
  }),
    (r = b(t));
}
function N(e) {
  if (!e) return;
  (Array.isArray(e) ? e : [e]).forEach((t) => {
    const { type: s, index: o, length: l } = t;
    s === "insert"
      ? r.forEach((i) => {
          i.start >= o ? ((i.start += l), (i.end += l)) : i.start < o && i.end > o && (i.end += l);
        })
      : s === "delete" &&
        (r.forEach((i) => {
          i.end <= o ||
            (i.start >= o + l
              ? ((i.start -= l), (i.end -= l))
              : (i.start < o ? (i.end = Math.max(i.start, o)) : (i.start = o), i.end < i.start && (i.end = i.start)));
        }),
        (r = r.filter((i) => i.start < i.end)));
  }),
    (r = b(r));
}
function p(e) {
  const n = d.value;
  let t = "",
    s = 0;
  const o = e.length;
  for (let l = 0; l < o; l++) {
    const i = e[l],
      { start: a, end: c, color: u, bold: f, italic: x } = i;
    a > s && (t += v(n.slice(s, a)));
    let y = "";
    u && (y += `color: ${u};`), f && (y += "font-weight: bold;"), x && (y += "font-style: italic;");
    const E = n.slice(a, c);
    y
      ? (t += `<span data-range-id="${l}" style="${y}">${v(E)}</span>`)
      : (t += `<span data-range-id="${l}">${v(E)}</span>`),
      (s = c);
  }
  s < n.length && (t += v(n.slice(s))), (I.innerHTML = t);
}
function q(e, n) {
  const t = document.createElement("div"),
    s = getComputedStyle(e);
  for (const f of s) t.style[f] = s[f];
  (t.style.position = "absolute"),
    (t.style.visibility = "hidden"),
    (t.style.whiteSpace = "pre-wrap"),
    (t.style.wordWrap = "break-word");
  const o = e.value.substring(0, n);
  t.textContent = o.replace(
    /\n/g,
    `
​`,
  );
  const l = document.createElement("span");
  (l.textContent = e.value.substring(n) || "."), t.appendChild(l), document.body.appendChild(t);
  const { offsetLeft: i, offsetTop: a } = l,
    { offsetLeft: c, offsetTop: u } = t;
  return document.body.removeChild(t), { top: u + a - e.scrollTop, left: c + i - e.scrollLeft };
}
function H() {
  const { selectionStart: e, selectionEnd: n } = d;
  if (e === n) {
    h.style.display = "none";
    return;
  }
  const { top: t, left: s } = q(d, n);
  (h.style.top = `${t + 20}px`), (h.style.left = `${s}px`), (h.style.display = "flex");
}
function m() {
  h.style.display = "none";
}
function j() {
  confirm("¿Seguro que deseas eliminar todos los estilos aplicados?") && ((r.length = 0), p(r));
}
let B;
const D = 300;
function Y(e) {
  clearTimeout(B), (B = setTimeout(e, D));
}
d.addEventListener("input", () => {
  Y(() => {
    const e = d.value,
      n = P(L, e);
    n && (N(n), p(r)), (L = e);
  });
});
d.addEventListener("mouseup", () => {
  setTimeout(H, 0);
});
document.addEventListener("click", (e) => {
  !h.contains(e.target) && e.target !== d && m();
});
T.addEventListener("click", () => {
  const { selectionStart: e, selectionEnd: n } = d;
  A("color", g.value, e, n), m(), p(r);
});
w.addEventListener("click", () => {
  const { selectionStart: e, selectionEnd: n } = d;
  k(e, n), m(), p(r);
});
M.addEventListener("click", () => {
  const { selectionStart: e, selectionEnd: n } = d;
  C("bold", e, n), m(), p(r);
});
O.addEventListener("click", () => {
  const { selectionStart: e, selectionEnd: n } = d;
  C("italic", e, n), m(), p(r);
});
$.addEventListener("click", () => {
  j(), m();
});
p(r);
