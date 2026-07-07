export async function POST(req: Request) {
  const webhookUrl = process.env.ZAPIER_SUPPORT_WEBHOOK_URL;
  if (!webhookUrl) {
    return new Response("Zapier webhook not configured", { status: 500 });
  }

  const body = await req.json();
  const { name, email, category, message } = body;

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, category, message, source: "portal-support" }),
  });

  return new Response(null, { status: res.ok ? 204 : 502 });
}
