export async function GET(req: Request) {
  const apiKey = process.env.CLOSE_API_KEY;
  if (!apiKey) {
    return Response.json({ data: [], has_more: false });
  }

  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since");
  const cursor = searchParams.get("cursor");

  let url = `https://api.close.com/api/v1/lead/?_limit=100&_fields=id,display_name,status_label,date_created&_order_by=-date_created`;
  if (since) url += `&date_created__gte=${encodeURIComponent(since)}`;
  if (cursor) url += `&_cursor=${encodeURIComponent(cursor)}`;

  const auth = "Basic " + Buffer.from(apiKey + ":").toString("base64");
  const res = await fetch(url, { headers: { Authorization: auth } });
  const data = await res.json();
  return Response.json(data);
}
