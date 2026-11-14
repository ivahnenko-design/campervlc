import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/contratos")({
  head: () => ({
    meta: [{ title: "Contratos | Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminContracts,
});

interface Row {
  id: string;
  status: "pending" | "signed" | "cancelled";
  guestName: string;
  email: string;
  source: string;
  bookingRef: string;
  startDate: string;
  endDate: string;
  createdAt: number;
  signedAt: number | null;
  language: string;
  provider: string;
}

const STATUS: Record<Row["status"], string> = { pending: "ждёт подписи", signed: "подписан", cancelled: "отменён" };
const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const EMPTY = {
  guestName: "",
  email: "",
  phone: "",
  source: "yescapa",
  language: "es",
  startDate: "",
  endDate: "",
  pickupTime: "10:00",
  returnTime: "10:00",
  priceTotal: "",
  bookingRef: "",
};

function AdminContracts() {
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    try {
      const t = sessionStorage.getItem("adminToken");
      if (t) {
        setToken(t);
        setSaved(true);
      }
    } catch {
      /* sessionStorage can be blocked */
    }
  }, []);

  const api = useCallback(
    async (path: string, init: RequestInit = {}) =>
      fetch(path, { ...init, headers: { "Content-Type": "application/json", "x-admin-token": token, ...(init.headers || {}) } }),
    [token],
  );

  const load = useCallback(async () => {
    if (!token) return;
    const r = await api("/api/admin-contracts");
    if (!r.ok) {
      setMsg(r.status === 401 ? "Неверный токен." : r.status === 503 ? "ADMIN_TOKEN не настроен в Vercel." : "Ошибка загрузки.");
      setSaved(false);
      return;
    }
    setRows(((await r.json()) as { contracts: Row[] }).contracts);
    setMsg(null);
  }, [api, token]);

  useEffect(() => {
    if (saved) void load();
  }, [saved, load]);

  function enter() {
    try {
      sessionStorage.setItem("adminToken", token);
    } catch {
      /* ignore */
    }
    setSaved(true);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setLink(null);
    try {
      const r = await api("/api/admin-contracts", { method: "POST", body: JSON.stringify({ action: "create", ...form }) });
      const j = (await r.json()) as { link?: string; emailSent?: boolean; error?: string };
      if (!r.ok) throw new Error(j.error || "Ошибка");
      setLink(j.link || null);
      setMsg(j.emailSent ? "Письмо клиенту отправлено. Ссылка ниже (можно отправить и в WhatsApp)." : "Письмо НЕ отправилось. Отправьте ссылку вручную.");
      setForm(EMPTY);
      await load();
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function act(id: string, action: "resend" | "cancel") {
    const r = await api("/api/admin-contracts", { method: "POST", body: JSON.stringify({ action, id }) });
    const j = (await r.json()) as { link?: string; emailSent?: boolean; error?: string };
    if (!r.ok) return setMsg(j.error || "Ошибка");
    if (j.link) {
      setLink(j.link);
      setMsg(j.emailSent ? "Новая ссылка отправлена клиенту (старая больше не работает)." : "Письмо не отправилось, используйте ссылку вручную.");
    }
    await load();
  }

  async function download(id: string) {
    const r = await api(`/api/admin-contracts?id=${id}&pdf=1`);
    if (!r.ok) return setMsg("PDF не найден.");
    const url = URL.createObjectURL(await r.blob());
    window.open(url, "_blank");
  }

  const field = (k: keyof typeof EMPTY, label: string, type = "text") => (
    <label className="block text-sm">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      <input className={inputCls} type={type} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
    </label>
  );

  if (!saved) {
    return (
      <main className="mx-auto max-w-sm bg-background px-4 py-16 text-foreground">
        <h1 className="font-display text-xl">Договоры (админ)</h1>
        <input className={`${inputCls} mt-4`} type="password" placeholder="Токен" value={token} onChange={(e) => setToken(e.target.value)} />
        <button onClick={enter} className="mt-3 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Войти</button>
        {msg && <p className="mt-3 text-sm text-destructive">{msg}</p>}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl bg-background px-4 py-8 text-foreground">
      <h1 className="font-display text-2xl">Электронные договоры</h1>

      <form onSubmit={create} className="mt-5 rounded-xl border border-border p-4">
        <h2 className="font-semibold">Новый договор (например, бронь из Yescapa)</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {field("guestName", "Имя клиента")}
          {field("email", "E-mail клиента", "email")}
          {field("phone", "Телефон")}
          {field("startDate", "Выдача (дата)", "date")}
          {field("pickupTime", "Время выдачи", "time")}
          {field("endDate", "Возврат (дата)", "date")}
          {field("returnTime", "Время возврата", "time")}
          {field("priceTotal", "Сумма, € (с НДС)", "number")}
          {field("bookingRef", "Номер брони (Yescapa)")}
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Источник</span>
            <select className={inputCls} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              <option value="yescapa">Yescapa</option>
              <option value="web">Сайт</option>
              <option value="other">Другое</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Язык клиента</span>
            <select className={inputCls} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
              {["es", "en", "ru", "uk", "de", "it", "nl"].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
        </div>
        <button disabled={busy} className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {busy ? "Создаём..." : "Создать и отправить клиенту"}
        </button>
        {msg && <p className="mt-3 text-sm">{msg}</p>}
        {link && (
          <p className="mt-2 break-all rounded-lg bg-muted px-3 py-2 text-xs">
            {link}{" "}
            <button type="button" className="underline" onClick={() => void navigator.clipboard.writeText(link)}>копировать</button>
          </p>
        )}
      </form>

      <h2 className="mt-8 font-semibold">Все договоры</h2>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr><th className="py-1 pr-3">Клиент</th><th className="pr-3">Даты</th><th className="pr-3">Источник</th><th className="pr-3">Статус</th><th /></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border align-top">
                <td className="py-2 pr-3">{r.guestName}<br /><span className="text-xs text-muted-foreground">{r.email}</span></td>
                <td className="pr-3">{r.startDate} → {r.endDate}</td>
                <td className="pr-3">{r.source}{r.bookingRef ? ` · ${r.bookingRef}` : ""}</td>
                <td className="pr-3">{STATUS[r.status]}{r.signedAt ? ` (${new Date(r.signedAt).toLocaleDateString()})` : ""}</td>
                <td className="space-x-2 whitespace-nowrap">
                  {r.status === "signed" && <button className="underline" onClick={() => void download(r.id)}>PDF</button>}
                  {r.status === "pending" && (
                    <>
                      <button className="underline" onClick={() => void act(r.id, "resend")}>новая ссылка</button>
                      <button className="underline" onClick={() => void act(r.id, "cancel")}>отменить</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className="py-3 text-muted-foreground" colSpan={5}>Пока пусто.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
