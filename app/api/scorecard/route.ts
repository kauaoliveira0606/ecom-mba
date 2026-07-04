export async function GET(req: Request) {
  const scorecardUrl = process.env.SCORECARD_APPS_SCRIPT_URL;
  if (!scorecardUrl) {
    return new Response("", { headers: { "Content-Type": "text/csv" } });
  }

  const { searchParams } = new URL(req.url);
  const week = searchParams.get("week") || "0";

  const res = await fetch(`${scorecardUrl}?week=${encodeURIComponent(week)}`);
  const text = await res.text();
  return new Response(text, { headers: { "Content-Type": "text/csv" } });
}
