import { useEffect, useMemo, useState } from "react";
import "./App.css";

const PHONE = "+998-94-522-21-81";
const TEL = "+998945222181";
const FREE_FROM = 300000;
const DELIVERY = 25000;

// img: rasm havolasi qo'shsangiz (masalan "/img/phone.jpg"), emoji o'rniga rasm chiqadi
const PRODUCTS = [
  { id: 1, cat: "Elektronika", n: "Smartfon Novda X12, 128 GB, qora", e: "📱", p: 2890000, o: 3490000, r: 4.8, c: 312, stock: 8, bg: "#dcefe0" },
  { id: 2, cat: "Elektronika", n: "Simsiz quloqchin Buds Pro, shovqinni yutuvchi", e: "🎧", p: 249000, o: 399000, r: 4.6, c: 874, stock: 41, bg: "#e6f2c9" },
  { id: 3, cat: "Elektronika", n: "Aqlli soat FitWatch 5, 1.8\" ekran", e: "⌚", p: 459000, o: 599000, r: 4.5, c: 421, stock: 17, bg: "#d4ebe6" },
  { id: 4, cat: "Kiyim", n: "Sport krossovka Run Air, erkaklar uchun", e: "👟", p: 329000, o: 459000, r: 4.7, c: 1203, stock: 5, bg: "#f3e4d0" },
  { id: 5, cat: "Kiyim", n: "Shahar ryukzagi, 25 litr, suv o'tmaydi", e: "🎒", p: 139000, o: 189000, r: 4.4, c: 256, stock: 23, bg: "#dfe8d0" },
  { id: 6, cat: "Uy-ro'zg'or", n: "Elektr choynak, 1.8 litr, zanglamaydigan po'lat", e: "☕", p: 119000, o: 159000, r: 4.6, c: 689, stock: 36, bg: "#f1dcd5" },
  { id: 7, cat: "Elektronika", n: "Noutbuk Novda Book 14, 16 GB / 512 GB", e: "💻", p: 6490000, o: 7290000, r: 4.9, c: 98, stock: 3, bg: "#d6e4ee" },
  { id: 8, cat: "Kitoblar", n: "Kitoblar to'plami, 5 ta eng ko'p sotilgan", e: "📚", p: 89000, o: 129000, r: 4.8, c: 540, stock: 60, bg: "#efe6c8" },
  { id: 9, cat: "Go'zallik", n: "Atir Yashil Bog', 50 ml", e: "🧴", p: 179000, o: 239000, r: 4.3, c: 167, stock: 14, bg: "#e3efe0" },
  { id: 10, cat: "Uy-ro'zg'or", n: "LED stol chirog'i, 3 xil yorug'lik", e: "💡", p: 99000, o: 149000, r: 4.5, c: 733, stock: 52, bg: "#f4efc4" },
];
const CATS = ["Barchasi", ...new Set(PRODUCTS.map((p) => p.cat))];

const fmt = (n) => n.toLocaleString("ru-RU").replace(/\u00a0/g, " ") + " so'm";
const load = (k, d) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; }
};

export default function App() {
  const [cart, setCart] = useState(() => load("novda-cart", {}));
  const [fav, setFav] = useState(() => load("novda-fav", []));
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Barchasi");
  const [sort, setSort] = useState("pop");
  const [view, setView] = useState(null); // cart | pay | done | help
  const [pay, setPay] = useState("cash");
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [card, setCard] = useState({ num: "", exp: "", name: "" });
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [orderNo, setOrderNo] = useState("");

  useEffect(() => { try { localStorage.setItem("novda-cart", JSON.stringify(cart)); } catch {} }, [cart]);
  useEffect(() => { try { localStorage.setItem("novda-fav", JSON.stringify(fav)); } catch {} }, [fav]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const items = useMemo(() => PRODUCTS.filter((p) => cart[p.id]).map((p) => ({ ...p, q: cart[p.id] })), [cart]);
  const sum = items.reduce((s, i) => s + i.p * i.q, 0);
  const count = items.reduce((s, i) => s + i.q, 0);
  const delivery = sum === 0 || sum >= FREE_FROM ? 0 : DELIVERY;
  const total = sum + delivery;

  const list = useMemo(() => {
    let l = PRODUCTS.filter(
      (p) => (cat === "Barchasi" || p.cat === cat) && p.n.toLowerCase().includes(q.trim().toLowerCase())
    );
    if (sort === "cheap") l = [...l].sort((a, b) => a.p - b.p);
    if (sort === "exp") l = [...l].sort((a, b) => b.p - a.p);
    if (sort === "pop") l = [...l].sort((a, b) => b.c - a.c);
    return l;
  }, [q, cat, sort]);

  const change = (id, d) =>
    setCart((c) => {
      const p = PRODUCTS.find((x) => x.id === id);
      const n = Math.min((c[id] || 0) + d, p.stock);
      const next = { ...c };
      if (n <= 0) delete next[id];
      else next[id] = n;
      return next;
    });
  const add = (p) => { change(p.id, 1); setToast("Savatga qo'shildi: " + p.n.split(",")[0]); };
  const toggleFav = (id) => setFav((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  const close = () => { setView(null); setErr(""); };

  function confirm() {
    const digits = form.phone.replace(/\D/g, "");
    if (form.name.trim().length < 2) return setErr("Ismingizni kiriting.");
    if (digits.length < 9) return setErr("Telefon raqamini to'liq kiriting.");
    if (form.address.trim().length < 5) return setErr("Yetkazish manzilini kiriting.");
    if (pay === "card") {
      if (card.num.replace(/\s/g, "").length !== 16) return setErr("Karta raqami 16 ta raqamdan iborat bo'lishi kerak.");
      if (!/^(0[1-9]|1[0-2])\/\d\d$/.test(card.exp)) return setErr("Amal qilish muddatini OY/YIL ko'rinishida kiriting.");
      if (card.name.trim().length < 3) return setErr("Karta egasining ismini kiriting.");
    }
    setErr("");
    setOrderNo("NM-" + Math.floor(100000 + Math.random() * 900000));
    setView("done");
  }
  function reset() {
    setCart({}); setCard({ num: "", exp: "", name: "" }); setPay("cash"); close();
  }

  return (
    <div className="app">
      <div className="strip">
        <span>📍 Toshkent</span>
        <span>{FREE_FROM.toLocaleString("ru-RU")} so'mdan yuqori buyurtmaga yetkazish bepul</span>
        <a href={"tel:" + TEL}>📞 {PHONE}</a>
      </div>

      <header className="head">
        <div className="logo"><i>N</i><span>Novda Market</span></div>
        <label className="search">
          <span aria-hidden>🔎</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tovarlarni qidirish" aria-label="Qidirish" />
        </label>
        <button className="hbtn" onClick={() => setView("cart")} aria-label="Savat">
          <span className="ic">🛒</span><span className="lb">Savat</span>
          {count > 0 && <b className="cnt" key={count}>{count}</b>}
        </button>
      </header>

      <nav className="cats" aria-label="Kategoriyalar">
        {CATS.map((c) => (
          <button key={c} className={"chip" + (cat === c ? " on" : "")} onClick={() => setCat(c)}>{c}</button>
        ))}
      </nav>

      <section className="banner">
        <div className="bt">
          <h1>Novda kunlari: 40% gacha chegirma</h1>
          <p>Eng ko'p sotilayotgan tovarlar, bepul yetkazish va Novda card bilan qulay to'lov.</p>
          <div className="tags"><span>🚚 Ertaga yetkazamiz</span><span>🛡️ 1 yil kafolat</span><span>↩️ 14 kun ichida qaytarish</span></div>
        </div>
        <div className="bimg" aria-hidden><span>📱</span><span>🎧</span><span>👟</span></div>
      </section>

      <div className="bar">
        <h2>{cat === "Barchasi" ? "Ommabop tovarlar" : cat} <small>{list.length} ta</small></h2>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Saralash">
          <option value="pop">Ommabop</option>
          <option value="cheap">Avval arzon</option>
          <option value="exp">Avval qimmat</option>
        </select>
      </div>

      <main className="grid">
        {list.length === 0 && <p className="empty">Hech narsa topilmadi. Boshqa so'z bilan qidirib ko'ring.</p>}
        {list.map((p) => (
          <article className="card" key={p.id}>
            <div className="pic" style={{ background: p.bg }}>
              {p.img ? <img src={p.img} alt={p.n} loading="lazy" /> : <span className="em" aria-hidden>{p.e}</span>}
              <span className="off">-{Math.round((1 - p.p / p.o) * 100)}%</span>
              <button className={"heart" + (fav.includes(p.id) ? " on" : "")} onClick={() => toggleFav(p.id)} aria-label="Sevimlilar" aria-pressed={fav.includes(p.id)}>
                {fav.includes(p.id) ? "♥" : "♡"}
              </button>
            </div>
            <div className="body">
              <h3>{p.n}</h3>
              <div className="rate"><span className="star">★</span> {p.r} <span>· {p.c} ta sharh</span></div>
              {p.stock <= 8 && <div className="low">Omborda {p.stock} ta qoldi</div>}
              <div className="inst">{fmt(Math.round(p.p / 12))} × 12 oy</div>
              <div className="prices"><s>{fmt(p.o)}</s><b>{fmt(p.p)}</b></div>
              {cart[p.id] ? (
                <div className="qty">
                  <button onClick={() => change(p.id, -1)} aria-label="Kamaytirish">−</button>
                  <b>{cart[p.id]}</b>
                  <button onClick={() => change(p.id, 1)} disabled={cart[p.id] >= p.stock} aria-label="Ko'paytirish">+</button>
                </div>
              ) : (
                <button className="add" onClick={() => add(p)}>Savatga</button>
              )}
            </div>
          </article>
        ))}
      </main>

      <footer className="foot">
        <div className="logo"><i>N</i><span>Novda Market</span></div>
        <p>Qo'llab-quvvatlash: <a href={"tel:" + TEL}>{PHONE}</a></p>
        <p>© {new Date().getFullYear()} Novda Market. Barcha huquqlar himoyalangan.</p>
      </footer>

      <button className="sup" onClick={() => setView("help")}>💬 Yordam</button>
      {toast && <div className="toast" role="status">✓ {toast}</div>}

      {view && view !== "help" && (
        <div className="ov" onClick={(e) => e.target === e.currentTarget && close()}>
          <aside className="dr" role="dialog" aria-label="Savat">
            <div className="top">
              <h2>{view === "cart" ? "Savat" : view === "pay" ? "Buyurtmani rasmiylashtirish" : ""}</h2>
              <button className="x" onClick={close} aria-label="Yopish">✕</button>
            </div>

            {view === "cart" && (
              <>
                {items.length === 0 ? (
                  <p className="muted">Savatingiz bo'sh. Tovarlarni tanlab, «Savatga» tugmasini bosing.</p>
                ) : (
                  items.map((i) => (
                    <div className="row" key={i.id}>
                      <div className="th" style={{ background: i.bg }}>{i.e}</div>
                      <div className="m">
                        <b>{i.n}</b>
                        <span className="muted">{fmt(i.p)}</span>
                      </div>
                      <div className="q">
                        <button onClick={() => change(i.id, -1)} aria-label="Kamaytirish">−</button>
                        <span>{i.q}</span>
                        <button onClick={() => change(i.id, 1)} disabled={i.q >= i.stock} aria-label="Ko'paytirish">+</button>
                      </div>
                    </div>
                  ))
                )}
                {items.length > 0 && (
                  <>
                    {delivery > 0 && <p className="hint">Yana {fmt(FREE_FROM - sum)} xarid qiling, yetkazish bepul bo'ladi.</p>}
                    <Summary count={count} sum={sum} delivery={delivery} total={total} />
                    <button className="main" onClick={() => setView("pay")}>Rasmiylashtirish</button>
                  </>
                )}
              </>
            )}

            {view === "pay" && (
              <>
                <div className="f">
                  <input placeholder="Ism Familiya" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <input placeholder="Telefon: +998 90 123 45 67" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  <input placeholder="Yetkazish manzili" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <h3 className="sub">To'lov usuli</h3>
                <Opt on={pay === "cash"} icon="💵" t="Naxt pul" s="Kuryerga tovarni olganda to'laysiz" onClick={() => { setPay("cash"); setErr(""); }} />
                <Opt on={pay === "card"} icon="💳" t="Novda card" s="Hozir karta orqali onlayn to'laysiz" onClick={() => { setPay("card"); setErr(""); }} />
                {pay === "card" && (
                  <div className="f">
                    <input placeholder="0000 0000 0000 0000" inputMode="numeric" aria-label="Karta raqami" value={card.num}
                      onChange={(e) => setCard({ ...card, num: e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim() })} />
                    <div className="two">
                      <input placeholder="OY/YIL" inputMode="numeric" aria-label="Amal qilish muddati" value={card.exp}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                          if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                          setCard({ ...card, exp: v });
                        }} />
                      <input placeholder="Karta egasi" aria-label="Karta egasi" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                    </div>
                  </div>
                )}
                {err && <p className="err" role="alert">{err}</p>}
                <Summary count={count} sum={sum} delivery={delivery} total={total} />
                <button className="main" onClick={confirm}>{pay === "cash" ? "Buyurtmani tasdiqlash" : fmt(total) + " to'lash"}</button>
                <button className="ghost" onClick={() => setView("cart")}>Savatga qaytish</button>
              </>
            )}

            {view === "done" && (
              <div className="ok">
                <div className="big">✅</div>
                <h2>Buyurtma qabul qilindi</h2>
                <p className="muted">Buyurtma raqami: <b>{orderNo}</b></p>
                <p className="muted">
                  {pay === "cash" ? `Kuryer yetkazganda ${fmt(total)} naxt to'laysiz.` : `${fmt(total)} Novda card orqali to'landi.`}
                </p>
                <p className="muted">Savollar bo'lsa: {PHONE}</p>
                <button className="main" onClick={reset}>Xaridni davom ettirish</button>
              </div>
            )}
          </aside>
        </div>
      )}

      {view === "help" && (
        <div className="ov center" onClick={(e) => e.target === e.currentTarget && close()}>
          <div className="modal" role="dialog" aria-label="Qo'llab-quvvatlash">
            <div className="big">🎧</div>
            <h2>Qo'llab-quvvatlash</h2>
            <p className="muted">Buyurtma yoki to'lov bo'yicha savolingiz bormi? Har kuni 09:00 dan 21:00 gacha javob beramiz.</p>
            <b className="ph">{PHONE}</b>
            <a className="main" href={"tel:" + TEL}>📞 Qo'ng'iroq qilish</a>
            <button className="ghost" onClick={close}>Yopish</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Summary({ count, sum, delivery, total }) {
  return (
    <div className="sum">
      <div><span>Tovarlar ({count} ta)</span><span>{fmt(sum)}</span></div>
      <div><span>Yetkazish</span><span>{delivery ? fmt(delivery) : "Bepul"}</span></div>
      <div className="tot"><span>Jami</span><strong>{fmt(total)}</strong></div>
    </div>
  );
}

function Opt({ on, icon, t, s, onClick }) {
  return (
    <button className={"opt" + (on ? " on" : "")} onClick={onClick} aria-pressed={on}>
      <span className="oi">{icon}</span>
      <span><b>{t}</b><small>{s}</small></span>
      <span className="radio" />
    </button>
  );
}