import { c as createServerFn, i as TSS_SERVER_FUNCTION } from "./createServerFn-CIHAFgYl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ical.functions-BNKac_-l.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var ICAL_URL = process.env.YESCAPA_ICS_URL || "https://www.yescapa.es/ical/xSqLp9AFgxkt4tuxKhsOkVE_dUttqO8l-4__qnei4Ki3kkmlB7plh-YL29aXUxqO/export/";
function toIsoDay(yyyymmdd) {
	return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}
function addDaysIso(iso, days) {
	const d = /* @__PURE__ */ new Date(`${iso}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}
function parseIcsDate(value) {
	const m = value.match(/^(\d{8})/);
	return m ? toIsoDay(m[1]) : null;
}
function isAllDay(line) {
	return /VALUE=DATE(?!-TIME)/i.test(line) || !/T\d{6}/.test(line);
}
function parseIcs(text) {
	const lines = text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
	const dates = /* @__PURE__ */ new Set();
	let inEvent = false;
	let start = null;
	let end = null;
	let endAllDay = false;
	for (const line of lines) {
		if (line === "BEGIN:VEVENT") {
			inEvent = true;
			start = null;
			end = null;
			endAllDay = false;
			continue;
		}
		if (line === "END:VEVENT") {
			if (start) {
				const last = end ? endAllDay ? addDaysIso(end, -1) : end : start;
				let cursor = start;
				for (let i = 0; i < 366 && cursor <= last; i++) {
					dates.add(cursor);
					cursor = addDaysIso(cursor, 1);
				}
			}
			inEvent = false;
			continue;
		}
		if (!inEvent) continue;
		if (line.startsWith("DTSTART")) {
			const v = line.split(":")[1];
			if (v) start = parseIcsDate(v);
		} else if (line.startsWith("DTEND")) {
			const v = line.split(":")[1];
			if (v) {
				end = parseIcsDate(v);
				endAllDay = isAllDay(line);
			}
		}
	}
	return Array.from(dates).sort();
}
var fetchYescapaBookedDates_createServerFn_handler = createServerRpc({
	id: "6ab6dbdfdd565ffbf591a5a523c49839d1a61b401eaacbb7ede0ec6d3779943d",
	name: "fetchYescapaBookedDates",
	filename: "src/lib/ical.functions.ts"
}, (opts) => fetchYescapaBookedDates.__executeServer(opts));
var fetchYescapaBookedDates = createServerFn({ method: "GET" }).handler(fetchYescapaBookedDates_createServerFn_handler, async () => {
	try {
		const res = await fetch(ICAL_URL, { headers: { Accept: "text/calendar, text/plain, */*" } });
		if (!res.ok) return {
			dates: [],
			error: `HTTP ${res.status}`
		};
		return { dates: parseIcs(await res.text()) };
	} catch (e) {
		return {
			dates: [],
			error: e instanceof Error ? e.message : "fetch failed"
		};
	}
});
//#endregion
export { fetchYescapaBookedDates_createServerFn_handler };
