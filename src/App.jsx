import { useState, useEffect, useRef } from "react";
import {
  Wallet,
  ListChecks,
  BellRing,
  Tags,
  Gauge,
  Plus,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";

const STORAGE_KEY = "majestic-helper-state";

const defaultState = {
  calc: [
    { id: 1, name: "Работа грузчика", invest: 0, perHour: 3000, hours: 3 },
    { id: 2, name: "Автомойка (бизнес)", invest: 250000, perHour: 9000, hours: 2 },
    { id: 3, name: "Дальнобойщик", invest: 0, perHour: 6500, hours: 2 },
  ],
  tracker: [],
  checklist: {
    "Перед вступлением": [
      { id: "c1", text: "Открыл F2 → Задания → Фракции", done: false },
      { id: "c2", text: "Проверил требования (уровень, репутация)", done: false },
      { id: "c3", text: "Подготовил документы персонажа", done: false },
      { id: "c4", text: "Прочитал правила фракции на вики/форуме", done: false },
    ],
    "Гос. фракции": [
      { id: "g1", text: "Записался на собеседование", done: false },
      { id: "g2", text: "Прошёл испытательный срок", done: false },
    ],
    "Криминальные фракции": [
      { id: "cr1", text: "Нашёл контакт / точку банды", done: false },
      { id: "cr2", text: "Готова легенда персонажа", done: false },
    ],
    "Семьи / бизнес-кланы": [
      { id: "f1", text: "Определился: создавать свою или вступать", done: false },
      { id: "f2", text: "Собран стартовый капитал", done: false },
    ],
  },
  reminders: [],
  prices: [
    { id: 1, item: "Обработанная древесина", price: 850, place: "Рынок" },
    { id: 2, item: "Шкура животного", price: 420, place: "Мясник" },
  ],
};

function fmt(n) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n || 0));
}

function useDebouncedSave(state, ready) {
  const timer = useRef(null);
  useEffect(() => {
    if (!ready) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error("Save failed", e);
      }
    }, 400);
    return () => clearTimeout(timer.current);
  }, [state, ready]);
}

const NAV = [
  { id: "calc", label: "Доходность", icon: Gauge },
  { id: "tracker", label: "Трекер", icon: Wallet },
  { id: "checklist", label: "Фракции", icon: ListChecks },
  { id: "reminders", label: "Напоминания", icon: BellRing },
  { id: "prices", label: "Цены", icon: Tags },
];

export default function MajesticHelper() {
  const [state, setState] = useState(defaultState);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("calc");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setState({ ...defaultState, ...JSON.parse(raw) });
      }
    } catch (e) {
      // no saved state yet, use defaults
    } finally {
      setReady(true);
    }
  }, []);

  useDebouncedSave(state, ready);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center text-[#8A9099]">
        <Loader2 className="animate-spin mr-2" size={18} /> загрузка...
      </div>
    );
  }

  const balance = state.tracker.reduce(
    (sum, t) => sum + (t.kind === "income" ? t.amount : -t.amount),
    0
  );

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#E7E9EC] font-sans">
      <div className="sticky top-0 z-10 border-b border-[#1E2126] bg-[#0B0D10]/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-[#3DFF9A]/70 font-mono">
              Majestic Helper
            </div>
            <div className="text-xl font-bold text-white leading-tight">Личный помощник</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-[#6B7280] font-mono">
              баланс трекера
            </div>
            <div
              className={`font-mono text-lg font-semibold ${
                balance >= 0 ? "text-[#3DFF9A]" : "text-[#FF6B6B]"
              }`}
            >
              {balance >= 0 ? "+" : ""}
              {fmt(balance)} $
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-5 flex gap-1 overflow-x-auto pb-2">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = tab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition-colors ${
                  active
                    ? "bg-[#3DFF9A]/10 text-[#3DFF9A] border border-[#3DFF9A]/30"
                    : "text-[#8A9099] border border-transparent hover:text-white"
                }`}
              >
                <Icon size={13} /> {n.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-8">
        {tab === "calc" && <CalcTab rows={state.calc} setRows={(r) => setState((s) => ({ ...s, calc: r }))} />}
        {tab === "tracker" && (
          <TrackerTab entries={state.tracker} setEntries={(e) => setState((s) => ({ ...s, tracker: e }))} />
        )}
        {tab === "checklist" && (
          <ChecklistTab data={state.checklist} setData={(d) => setState((s) => ({ ...s, checklist: d }))} />
        )}
        {tab === "reminders" && (
          <RemindersTab items={state.reminders} setItems={(i) => setState((s) => ({ ...s, reminders: i }))} />
        )}
        {tab === "prices" && (
          <PricesTab rows={state.prices} setRows={(r) => setState((s) => ({ ...s, prices: r }))} />
        )}
      </div>
    </div>
  );
}

function CalcTab({ rows, setRows }) {
  function update(id, field, value) {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: field === "name" ? value : Number(value) } : r)));
  }
  function addRow() {
    setRows([...rows, { id: Date.now(), name: "Новый источник", invest: 0, perHour: 1000, hours: 1 }]);
  }
  function removeRow(id) {
    setRows(rows.filter((r) => r.id !== id));
  }

  const computed = rows
    .map((r) => {
      const daily = r.perHour * r.hours;
      const payback = r.invest > 0 && daily > 0 ? r.invest / daily : 0;
      const monthly = daily * 30 - r.invest;
      return { ...r, daily, payback, monthly };
    })
    .sort((a, b) => b.daily - a.daily);
  const best = computed[0];

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-1">Что приносит деньги быстрее?</h2>
      <p className="text-[#8A9099] text-sm mb-5">
        Сравни доход в час, срок окупаемости и прогноз за месяц.
      </p>

      <div className="rounded-xl border border-[#1E2126] bg-[#111418] overflow-hidden">
        <div className="grid grid-cols-[1.6fr_1fr_1fr_0.7fr_0.4fr] gap-2 px-4 py-3 text-[11px] uppercase tracking-wider text-[#6B7280] border-b border-[#1E2126] font-mono">
          <span>Источник</span>
          <span>Вложения, $</span>
          <span>$/час</span>
          <span>Часов/день</span>
          <span></span>
        </div>
        {computed.map((r) => (
          <div
            key={r.id}
            className={`grid grid-cols-[1.6fr_1fr_1fr_0.7fr_0.4fr] gap-2 px-4 py-3 items-center border-b border-[#1E2126] last:border-b-0 ${
              r.id === best?.id ? "bg-[#3DFF9A]/[0.05]" : ""
            }`}
          >
            <input
              value={r.name}
              onChange={(e) => update(r.id, "name", e.target.value)}
              className="bg-transparent border-b border-transparent focus:border-[#3DFF9A]/50 outline-none text-sm text-white py-1"
            />
            <input
              type="number"
              value={r.invest}
              onChange={(e) => update(r.id, "invest", e.target.value)}
              className="bg-[#0B0D10] rounded-md px-2 py-1 text-sm font-mono border border-[#1E2126] focus:border-[#3DFF9A]/50 outline-none w-full"
            />
            <input
              type="number"
              value={r.perHour}
              onChange={(e) => update(r.id, "perHour", e.target.value)}
              className="bg-[#0B0D10] rounded-md px-2 py-1 text-sm font-mono border border-[#1E2126] focus:border-[#3DFF9A]/50 outline-none w-full"
            />
            <input
              type="number"
              value={r.hours}
              onChange={(e) => update(r.id, "hours", e.target.value)}
              className="bg-[#0B0D10] rounded-md px-2 py-1 text-sm font-mono border border-[#1E2126] focus:border-[#3DFF9A]/50 outline-none w-full"
            />
            <button onClick={() => removeRow(r.id)} className="text-[#6B7280] hover:text-[#FF6B6B] justify-self-center">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          onClick={addRow}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-[#8A9099] hover:text-[#3DFF9A] hover:bg-[#3DFF9A]/[0.04] transition-colors font-mono"
        >
          <Plus size={15} /> добавить источник
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mt-5">
        {computed.map((r) => (
          <div
            key={r.id}
            className={`rounded-xl border p-4 ${
              r.id === best?.id ? "border-[#3DFF9A]/40 bg-[#3DFF9A]/[0.06]" : "border-[#1E2126] bg-[#111418]"
            }`}
          >
            <div className="text-sm text-white font-medium mb-3 truncate">{r.name}</div>
            <div className="text-[#8A9099] text-xs mb-1">в день</div>
            <div className="font-mono text-lg text-[#3DFF9A]">{fmt(r.daily)} $</div>
            <div className="text-[#8A9099] text-xs mt-3 mb-1">окупаемость</div>
            <div className="font-mono text-sm text-white">
              {r.invest > 0 ? `${r.payback.toFixed(1)} дн.` : "без вложений"}
            </div>
            <div className="text-[#8A9099] text-xs mt-3 mb-1">за 30 дней</div>
            <div className="font-mono text-sm text-[#F2B94A]">{fmt(r.monthly)} $</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrackerTab({ entries, setEntries }) {
  const [form, setForm] = useState({ kind: "income", amount: "", note: "" });

  function add() {
    if (!form.amount) return;
    setEntries([
      { id: Date.now(), kind: form.kind, amount: Number(form.amount), note: form.note, date: new Date().toISOString() },
      ...entries,
    ]);
    setForm({ kind: "income", amount: "", note: "" });
  }
  function remove(id) {
    setEntries(entries.filter((e) => e.id !== id));
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-1">Трекер дохода и расходов</h2>
      <p className="text-[#8A9099] text-sm mb-5">Записывай, что заработал или потратил — баланс наверху считается автоматически.</p>

      <div className="rounded-xl border border-[#1E2126] bg-[#111418] p-4 flex flex-wrap gap-2 mb-5">
        <select
          value={form.kind}
          onChange={(e) => setForm({ ...form, kind: e.target.value })}
          className="bg-[#0B0D10] border border-[#1E2126] rounded-md px-2 py-2 text-sm font-mono"
        >
          <option value="income">Доход</option>
          <option value="expense">Расход</option>
        </select>
        <input
          type="number"
          placeholder="Сумма"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="bg-[#0B0D10] border border-[#1E2126] rounded-md px-2 py-2 text-sm font-mono w-28"
        />
        <input
          placeholder="Заметка (напр. смена грузчика)"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          className="bg-[#0B0D10] border border-[#1E2126] rounded-md px-2 py-2 text-sm flex-1 min-w-[140px]"
        />
        <button
          onClick={add}
          className="flex items-center gap-1 bg-[#3DFF9A]/10 text-[#3DFF9A] border border-[#3DFF9A]/30 rounded-md px-3 py-2 text-sm font-mono hover:bg-[#3DFF9A]/20"
        >
          <Plus size={15} /> добавить
        </button>
      </div>

      <div className="rounded-xl border border-[#1E2126] bg-[#111418] overflow-hidden">
        {entries.length === 0 && (
          <div className="px-4 py-8 text-center text-[#565B63] text-sm">Пока пусто — добавь первую запись</div>
        )}
        {entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between px-4 py-3 border-b border-[#1E2126] last:border-b-0">
            <div>
              <div className="text-sm text-white">{e.note || (e.kind === "income" ? "Доход" : "Расход")}</div>
              <div className="text-[11px] text-[#6B7280] font-mono">
                {new Date(e.date).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-mono text-sm ${e.kind === "income" ? "text-[#3DFF9A]" : "text-[#FF6B6B]"}`}>
                {e.kind === "income" ? "+" : "-"}
                {fmt(e.amount)} $
              </span>
              <button onClick={() => remove(e.id)} className="text-[#6B7280] hover:text-[#FF6B6B]">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistTab({ data, setData }) {
  function toggle(cat, id) {
    setData({
      ...data,
      [cat]: data[cat].map((it) => (it.id === id ? { ...it, done: !it.done } : it)),
    });
  }
  function addItem(cat, text) {
    if (!text) return;
    setData({ ...data, [cat]: [...data[cat], { id: `${cat}-${Date.now()}`, text, done: false }] });
  }
  function removeItem(cat, id) {
    setData({ ...data, [cat]: data[cat].filter((it) => it.id !== id) });
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-1">Чек-лист по фракциям</h2>
      <p className="text-[#8A9099] text-sm mb-5">Отмечай выполненное, добавляй свои пункты под каждую категорию.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        {Object.entries(data).map(([cat, items]) => (
          <CategoryBlock key={cat} cat={cat} items={items} toggle={toggle} addItem={addItem} removeItem={removeItem} />
        ))}
      </div>
    </div>
  );
}

function CategoryBlock({ cat, items, toggle, addItem, removeItem }) {
  const [val, setVal] = useState("");
  const doneCount = items.filter((i) => i.done).length;
  return (
    <div className="rounded-xl border border-[#1E2126] bg-[#111418] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{cat}</h3>
        <span className="text-[11px] font-mono text-[#6B7280]">
          {doneCount}/{items.length}
        </span>
      </div>
      <div className="space-y-2 mb-3">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-2 group">
            <button
              onClick={() => toggle(cat, it.id)}
              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                it.done ? "bg-[#3DFF9A] border-[#3DFF9A]" : "border-[#3A3F47]"
              }`}
            >
              {it.done && <Check size={11} className="text-[#0B0D10]" />}
            </button>
            <span className={`text-sm flex-1 ${it.done ? "text-[#565B63] line-through" : "text-[#E7E9EC]"}`}>
              {it.text}
            </span>
            <button
              onClick={() => removeItem(cat, it.id)}
              className="text-[#3A3F47] hover:text-[#FF6B6B] opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addItem(cat, val);
              setVal("");
            }
          }}
          placeholder="Добавить пункт..."
          className="bg-[#0B0D10] border border-[#1E2126] rounded-md px-2 py-1.5 text-sm flex-1 outline-none focus:border-[#3DFF9A]/50"
        />
        <button
          onClick={() => {
            addItem(cat, val);
            setVal("");
          }}
          className="text-[#3DFF9A] px-2"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function RemindersTab({ items, setItems }) {
  const [form, setForm] = useState({ title: "", due: "" });

  function add() {
    if (!form.title) return;
    setItems([...items, { id: Date.now(), title: form.title, due: form.due, done: false }]);
    setForm({ title: "", due: "" });
  }
  function toggle(id) {
    setItems(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }
  function remove(id) {
    setItems(items.filter((i) => i.id !== id));
  }

  const sorted = [...items].sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-1">Напоминания</h2>
      <p className="text-[#8A9099] text-sm mb-5">Продление лицензий, бизнеса, оплата фракционных взносов и т.д.</p>

      <div className="rounded-xl border border-[#1E2126] bg-[#111418] p-4 flex flex-wrap gap-2 mb-5">
        <input
          placeholder="Например: продлить лицензию оружия"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="bg-[#0B0D10] border border-[#1E2126] rounded-md px-2 py-2 text-sm flex-1 min-w-[160px]"
        />
        <input
          type="date"
          value={form.due}
          onChange={(e) => setForm({ ...form, due: e.target.value })}
          className="bg-[#0B0D10] border border-[#1E2126] rounded-md px-2 py-2 text-sm font-mono"
        />
        <button
          onClick={add}
          className="flex items-center gap-1 bg-[#3DFF9A]/10 text-[#3DFF9A] border border-[#3DFF9A]/30 rounded-md px-3 py-2 text-sm font-mono hover:bg-[#3DFF9A]/20"
        >
          <Plus size={15} /> добавить
        </button>
      </div>

      <div className="rounded-xl border border-[#1E2126] bg-[#111418] overflow-hidden">
        {sorted.length === 0 && (
          <div className="px-4 py-8 text-center text-[#565B63] text-sm">Напоминаний нет</div>
        )}
        {sorted.map((i) => (
          <div key={i.id} className="flex items-center justify-between px-4 py-3 border-b border-[#1E2126] last:border-b-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggle(i.id)}
                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                  i.done ? "bg-[#3DFF9A] border-[#3DFF9A]" : "border-[#3A3F47]"
                }`}
              >
                {i.done && <Check size={11} className="text-[#0B0D10]" />}
              </button>
              <div>
                <div className={`text-sm ${i.done ? "text-[#565B63] line-through" : "text-white"}`}>{i.title}</div>
                {i.due && <div className="text-[11px] text-[#6B7280] font-mono">до {i.due}</div>}
              </div>
            </div>
            <button onClick={() => remove(i.id)} className="text-[#6B7280] hover:text-[#FF6B6B]">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PricesTab({ rows, setRows }) {
  function update(id, field, value) {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: field === "price" ? Number(value) : value } : r)));
  }
  function addRow() {
    setRows([...rows, { id: Date.now(), item: "Новый товар", price: 0, place: "" }]);
  }
  function removeRow(id) {
    setRows(rows.filter((r) => r.id !== id));
  }

  const sorted = [...rows].sort((a, b) => b.price - a.price);

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-1">Цены на маркетплейсе</h2>
      <p className="text-[#8A9099] text-sm mb-5">Сравнивай, где выгоднее продавать или покупать ресурсы.</p>

      <div className="rounded-xl border border-[#1E2126] bg-[#111418] overflow-hidden">
        <div className="grid grid-cols-[1.6fr_1fr_1fr_0.4fr] gap-2 px-4 py-3 text-[11px] uppercase tracking-wider text-[#6B7280] border-b border-[#1E2126] font-mono">
          <span>Товар</span>
          <span>Цена, $</span>
          <span>Где</span>
          <span></span>
        </div>
        {sorted.map((r) => (
          <div key={r.id} className="grid grid-cols-[1.6fr_1fr_1fr_0.4fr] gap-2 px-4 py-3 items-center border-b border-[#1E2126] last:border-b-0">
            <input
              value={r.item}
              onChange={(e) => update(r.id, "item", e.target.value)}
              className="bg-transparent text-sm text-white outline-none border-b border-transparent focus:border-[#3DFF9A]/50 py-1"
            />
            <input
              type="number"
              value={r.price}
              onChange={(e) => update(r.id, "price", e.target.value)}
              className="bg-[#0B0D10] rounded-md px-2 py-1 text-sm font-mono border border-[#1E2126] focus:border-[#3DFF9A]/50 outline-none w-full"
            />
            <input
              value={r.place}
              onChange={(e) => update(r.id, "place", e.target.value)}
              className="bg-[#0B0D10] rounded-md px-2 py-1 text-sm border border-[#1E2126] focus:border-[#3DFF9A]/50 outline-none w-full"
            />
            <button onClick={() => removeRow(r.id)} className="text-[#6B7280] hover:text-[#FF6B6B] justify-self-center">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          onClick={addRow}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-[#8A9099] hover:text-[#3DFF9A] hover:bg-[#3DFF9A]/[0.04] transition-colors font-mono"
        >
          <Plus size={15} /> добавить товар
        </button>
      </div>
    </div>
  );
}
