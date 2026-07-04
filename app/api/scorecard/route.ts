export async function GET(req: Request) {
  const scorecardUrl = process.env.SCORECARD_APPS_SCRIPT_URL;
  if (!scorecardUrl) {
    return Response.json({ data: [] });
  }

  const { searchParams } = new URL(req.url);
  const week = searchParams.get("week") || "0";

  const res = await fetch(`${scorecardUrl}?week=${encodeURIComponent(week)}`);
  const data = await res.json();
  return Response.json(data);
}
