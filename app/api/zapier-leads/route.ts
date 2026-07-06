export async function POST(req: Request) {
  const webhookUrl = process.env.ZAPIER_LEADS_WEBHOOK_URL;
  if (!webhookUrl) {
    return new Response("Zapier webhook not configured", { status: 500 });
  }

  const body = await req.json();
  const { name, email, phone } = body;

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, phone, source: "base44" }),
  });

  return new Response(null, { status: res.ok ? 204 : 502 });
}
