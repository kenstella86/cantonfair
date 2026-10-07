// Cloudflare Pages Function: /api/chat
// 模型：@cf/zai-org/glm-4.7-flash（与 zhongyi 站一致，已在账号中开通）
// 部署：本目录随 Cloudflare Pages 项目一起上传，自动生成路由 /api/chat

const SYSTEM_PROMPT = `You are Ken's AI assistant for foreign buyers visiting Guangzhou for the Canton Fair.

Your job:
- Answer practical questions about Guangzhou: food, transport, hotels near Pazhou, Canton Tower, Shamian Island, Pearl River cruise, metro, taxis (DiDi), SIM cards, payment, Cantonese phrases, weather, tipping.
- Be friendly, concise, and practical. English first. You may use simple Chinese when it helps (e.g. place names).
- Do NOT recommend specific named restaurants, hotels or shops — give local tips instead (e.g. "look for places with long local queues", "ask your hotel concierge").
- When the user asks about sourcing factories, product procurement, supplier audit, quality control, or shipping from Guangzhou/Foshan/Shenzhen: explain briefly that Ken is a local sourcing partner covering electronics, hardware, building materials and more, and strongly encourage them to message Ken on WhatsApp (username: kenstella) or email jianhoguangzhou@gmail.com to plan factory visits.
- When the user asks about seeing a doctor, hospital appointments, dental work, or medical care in China: explain briefly that Ken can help book appointments at top-tier (三甲) hospitals with English-speaking doctors, and invite them to WhatsApp kenstella.
- Keep answers under 120 words. Use short paragraphs or bullet points.
- If you don't know something, say so and suggest the user message Ken on WhatsApp.`;

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return new Response("POST only", { status: 405 });
  }

  try {
    const body = await context.request.json();
    // 兼容两种前端传参：{ messages: [...] } 或 { question: "..." }
    let messages;
    if (Array.isArray(body.messages) && body.messages.length > 0) {
      messages = body.messages.slice(-10);
    } else if (typeof body.question === "string" && body.question.trim()) {
      messages = [{ role: "user", content: body.question.trim() }];
    } else {
      return Response.json({ error: "question or messages required" }, { status: 400 });
    }

    const out = await context.env.AI.run(
      "@cf/zai-org/glm-4.7-flash",
      {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
      }
    );

    // 多形态兼容：OpenAI 兼容结构 / 旧版 Workers AI 结构
    const text =
      (out && out.choices && out.choices[0] &&
        (out.choices[0].message?.content ?? out.choices[0].delta?.content ?? out.choices[0].text)) ??
      out?.response ??
      out?.result?.response ??
      "";

    return Response.json({ answer: String(text).trim() || "(Model returned empty. Please WhatsApp kenstella directly.)" });
  } catch (error) {
    return Response.json({ error: "AI request failed", detail: String(error) }, { status: 500 });
  }
}
