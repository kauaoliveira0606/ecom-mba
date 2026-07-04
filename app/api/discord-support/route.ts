export async function POST(req: Request) {
  const webhookUrl = process.env.SUPPORT_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return new Response("Discord webhook not configured", { status: 500 });
  }

  const body = await req.json();
  const { name, email, category, message } = body;

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `🎫 **New Support Ticket**\n**Name:** ${name}\n**Email:** ${email}\n**Category:** ${category}\n**Message:** ${message}`,
    }),
  });

  return new Response(null, { status: res.ok ? 204 : 502 });
}
