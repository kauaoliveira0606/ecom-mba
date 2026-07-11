// Cron: runs Mon/Thu via vercel.json.
// Pulls upcoming live_calls from the aistorebuilder Supabase, maps them to 4
// coaching-call slots, and writes them to this portal's coaching_settings
// table so the Coaching Calls tab always shows current times/links.

const ASBUILDER_URL = "https://aucakdtwvdhedqttxbyo.supabase.co";
const ASBUILDER_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1Y2FrZHR3dmRoZWRxdHR4YnlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTgzNTQsImV4cCI6MjA4MzEzNDM1NH0.QGsc4_bjEEEVkxt6m3AB623mNktFHsU3rItvmhinB_g";

const PORTAL_URL = "https://bmpjjmtpkcjwmubdsuek.supabase.co/rest/v1";
const PORTAL_KEY = "sb_publishable_UtZIMav5o005fLRtya8avw_cipIVea7";

// Slot 0: wix-monthly (Kiryl) · Slot 1/2: wix-yearly + diamond (Julia 1st/2nd) · Slot 3: constant-contact (Alex)
const SLOT_LABELS = [
  "Wix Monthly Call",
  "Wix Yearly Call",
  "Diamond Call",
  "Constant Contact Call",
];

type Slot = { label: string; time: string; link: string } | null;

function fmtTime(isoStr: string) {
  const d = new Date(isoStr);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const day = days[d.getUTCDay()];
  let h = d.getUTCHours() - 4; // EST = UTC-4
  if (h < 0) h += 24;
  const ampm = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  const m = d.getUTCMinutes();
  const mStr = m > 0 ? `:${String(m).padStart(2, "0")}` : "";
  return `${day} ${h}${mStr} ${ampm} EST`;
}

export async function GET() {
  const email = process.env.ASBUILDER_EMAIL;
  const pass = process.env.ASBUILDER_PASS;
  if (!email || !pass) {
    return Response.json({ error: "Missing ASBUILDER_EMAIL/ASBUILDER_PASS env vars" }, { status: 500 });
  }

  try {
    // 1. Auth with aistorebuilder Supabase
    const authRes = await fetch(`${ASBUILDER_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: ASBUILDER_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });
    const auth = await authRes.json();
    if (!auth.access_token) {
      return Response.json({ error: "Auth failed", detail: auth }, { status: 500 });
    }

    // 2. Fetch next 14 days of live calls
    const now = new Date().toISOString();
    const soon = new Date(Date.now() + 14 * 86400000).toISOString();
    const callsRes = await fetch(
      `${ASBUILDER_URL}/rest/v1/live_calls?scheduled_at=gte.${now}&scheduled_at=lte.${soon}&order=scheduled_at.asc&limit=50`,
      { headers: { apikey: ASBUILDER_KEY, Authorization: `Bearer ${auth.access_token}` } }
    );
    const calls = await callsRes.json();
    if (!Array.isArray(calls)) {
      return Response.json({ error: "Bad calls response", detail: calls }, { status: 500 });
    }

    // 3. Map to 4 slots — pick next upcoming per coach
    const slots: Slot[] = [null, null, null, null];
    let juliaCount = 0;

    for (const call of calls) {
      const name = (call.title || "").toLowerCase();
      if (name.includes("kiryl") && slots[0] === null) {
        slots[0] = { label: SLOT_LABELS[0], time: fmtTime(call.scheduled_at), link: call.meeting_link };
      } else if (name.includes("julia")) {
        if (juliaCount === 0 && slots[1] === null) {
          slots[1] = { label: SLOT_LABELS[1], time: fmtTime(call.scheduled_at), link: call.meeting_link };
          juliaCount++;
        } else if (juliaCount === 1 && slots[2] === null) {
          slots[2] = { label: SLOT_LABELS[2], time: fmtTime(call.scheduled_at), link: call.meeting_link };
          juliaCount++;
        }
      } else if (name.includes("alex") && slots[3] === null) {
        slots[3] = { label: SLOT_LABELS[3], time: fmtTime(call.scheduled_at), link: call.meeting_link };
      }
      if (slots.every((s) => s !== null)) break;
    }

    const finalCalls = slots.map((s, i) => s || { label: SLOT_LABELS[i], time: "", link: "" });

    // 4. Write to this portal's coaching_settings (upsert: PATCH row 1, INSERT if missing)
    const details = JSON.stringify({ calls: finalCalls, synced_at: new Date().toISOString() });
    const portalHeaders = {
      apikey: PORTAL_KEY,
      Authorization: `Bearer ${PORTAL_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    };

    let saveRes = await fetch(`${PORTAL_URL}/coaching_settings?id=eq.1`, {
      method: "PATCH",
      headers: portalHeaders,
      body: JSON.stringify({ details }),
    });

    if (saveRes.status === 404 || saveRes.status === 406) {
      saveRes = await fetch(`${PORTAL_URL}/coaching_settings`, {
        method: "POST",
        headers: portalHeaders,
        body: JSON.stringify({ zoom_link: "", details }),
      });
    }

    if (!saveRes.ok && saveRes.status !== 201) {
      const err = await saveRes.text();
      return Response.json({ error: "Save failed", status: saveRes.status, detail: err }, { status: 500 });
    }

    return Response.json({ ok: true, calls: finalCalls });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
