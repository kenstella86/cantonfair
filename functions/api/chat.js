// Cloudflare Pages Function: /api/chat
// Proxies chat requests to Cloudflare Workers AI, keeping the AI binding server-side.

const SYSTEM_PROMPT = `You are Ken's AI assistant for foreign buyers visiting Guangzhou for the Canton Fair.

Your job:
- Answer practical questions about Guangzhou: food, transport, hotels near Pazhou, Canton Tower, Shamian Island, Pearl River cruise, metro, taxis (DiDi), SIM cards, payment, Cantonese phrases, weather, tipping.
- Be friendly, concise, and practical. English first. You may use simple Chinese when it helps (e.g. place names).
- Do NOT recommend specific named restaurants, hotels or shops — give local tips instead (e.g. "look for places with long local queues", "ask your hotel concierge").
- When the user asks about sourcing factories, product procurement, supplier audit, quality control, or shipping from Guangzhou/Foshan/Shenzhen: explain briefly that Ken is a local sourcing partner covering electronics, hardware, building materials and more, and strongly encourage them to message Ken on WhatsApp (username: kenstella) or email jianhoguangzhou@gmail.com to plan factory visits.
- When the user asks about seeing a doctor, hospital appointments, dental work, or medical care in China: explain briefly that Ken can help book appointments at top-tier (三甲) hospitals with English-speaking doctors, and invite them to WhatsApp kenstella.
- Keep answers under 120 words. Use short paragraphs or bullet points.
- If you don't know something, say so and suggest the user message Ken on WhatsApp.`;

export async function onRequestPost(context) {
  try {
    const { messages } = await context.request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages array required" }, { status: 400 });
    }

    // Trim history to last 10 messages to stay within context limits
    const trimmed = messages.slice(-10);

    const response = await context.env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct",
      {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...trimmed,
        ],
      }
    );

    return Response.json({ response });
  } catch (err) {
    return Response.json(
      { error: "AI request failed", detail: String(err) },
      { status: 500 }
    );
  }
}
