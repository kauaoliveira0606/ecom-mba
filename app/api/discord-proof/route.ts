export async function POST(req: Request) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return new Response("Discord webhook not configured", { status: 500 });
  }

  const incoming = await req.formData();
  const file = incoming.get("file");
  const email = incoming.get("email") ?? "unknown";
  const tab = incoming.get("tab") ?? "unknown";
  const action = incoming.get("action") ?? "unknown";

  if (!(file instanceof File)) {
    return new Response("Missing file", { status: 400 });
  }

  const outgoing = new FormData();
  outgoing.append(
    "content",
    `📸 **New Proof Submission**\n**Email:** ${email}\n**Tab:** ${tab}\n**Action:** ${action}`
  );
  outgoing.append("file", file, file.name);

  const discordRes = await fetch(webhookUrl, {
    method: "POST",
    body: outgoing,
  });

  return new Response(null, { status: discordRes.ok ? 204 : 502 });
}
