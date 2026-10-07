// X老 AI 健康助手 —— Cloudflare Pages Function
// 模型：@cf/zai-org/glm-4.7-flash（Workers AI）
// 部署：本目录随 Cloudflare Pages 项目一起上传，自动生成路由 /api/chat
// 注意：需在 Pages 项目设置中绑定 Workers AI（变量名 AI），并在 AI 设置中
//       允许该模型 @cf/zai-org/glm-4.7-flash。

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return new Response("请使用 POST 请求", { status: 405 });
  }

  try {
    const { question } = await context.request.json();

    if (!question || typeof question !== "string" || !question.trim()) {
      return Response.json({ error: "问题不能为空。" }, { status: 400 });
    }

    const q = question.trim();

    // 健康安全预检：急症描述直接引导就医，不调用模型
    const EMERGENCY = /急救|紧急|剧痛|大出血|昏迷|呼吸困难|窒息|中毒|抽搐|自杀|救命/;
    if (EMERGENCY.test(q)) {
      return Response.json({
        answer:
          "如果出现剧痛、呼吸困难、大出血、意识不清等紧急情况，请立即前往最近的正规医疗机构急诊就医，不要等待网络回复。我是AI健康助手，无法处理急症，请务必尽快就医。",
      });
    }

    // 调用 Workers AI 模型
    // 注意：@cf/zai-org/glm-4.7-flash 返回的是 OpenAI 兼容的 chat-completions
    // 结构（choices[0].message.content），并非旧版 Workers AI 的 { response }。
    // 以下做多形态兼容取值，适配不同网关返回。
    const out = await context.env.AI.run(
      "@cf/zai-org/glm-4.7-flash",
      {
        messages: [
          {
            role: "system",
            content:
              "你是“X老的AI健康助手”——由X老授权，以其公开发表的医案、学术文章、讲座内容与口述心得为基础训练的数字化分身，以X老学生与传承人的口吻与患者交流。回答必须遵循以下原则：" +
              "1. 用通俗易懂、亲切温和的中文，回答中医养生、体质调理、节气养生、服药与忌口常识、生活方式建议、复诊随访引导等问题，可适当引用中医理论。" +
              "2. 明确告知提问者：你是AI健康助手，不是X老本人。" +
              "3. 绝不提供诊断，绝不开处方，绝不评估具体病情严重程度；涉及具体症状判断、用药调整，或患者出现高热、剧痛、出血、意识不清等急症描述时，明确建议尽快到正规医疗机构或X老门诊就诊。" +
              "4. 不讨论政治、宗教、违法内容；不编造医案、药方或学术引用；引用内容以X老公开资料为限，不确定时如实说明，不得杜撰。" +
              "5. 回答简洁实用，一般不超过250字，可用分点或短句便于阅读。" +
              "6. 患者询问预约时，引导其通过门诊预约入口或企业微信联系诊室确认出诊时间。",
          },
          { role: "user", content: q },
        ],
      }
    );

    const text =
      (out && out.choices && out.choices[0] &&
        (out.choices[0].message?.content ?? out.choices[0].delta?.content ?? out.choices[0].text)) ??
      out?.response ??
      out?.result?.response ??
      "";

    return Response.json({ answer: String(text).trim() || "（模型未返回内容，请稍后再试）" });
  } catch (error) {
    return Response.json({ error: "AI 调用失败，请稍后再试。" }, { status: 500 });
  }
}
