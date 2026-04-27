exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    
    // Accept either format
    let prompt;
    if (body.prompt) {
      prompt = body.prompt;
    } else {
      const { answers, playerName, parentName, zip } = body;
      prompt = `You are a 10U lacrosse coach. Respond ONLY with valid JSON, no markdown, no backticks, no extra text before or after.

Player: ${playerName}, Parent: ${parentName}, Zip: ${zip||'not provided'}
Experience: ${answers.experience}
Struggles: ${(answers.struggles||[]).join(', ')}
Strengths: ${(answers.strengths||[]).join(', ')}
Position: ${answers.position}, Days: ${answers.days}, Equipment: ${answers.equipment}
Setting: ${answers.setting}, Goal: ${answers.goal}, Parent exp: ${answers.parent_exp}

Return ONLY this JSON:
{"headline":"warm sentence","skill_level_label":"First Steps","skill_level_summary":"2 sentences","top_focus":"skill","why_this_focus":"sentence","skill_breakdown":[{"skill":"Catching","status":"needs work","note":"note"},{"skill":"Throwing","status":"developing","note":"note"},{"skill":"Ground balls","status":"needs work","note":"note"},{"skill":"Cradling","status":"developing","note":"note"},{"skill":"Field sense","status":"needs work","note":"note"}],"week_plan":[{"day":"Day 1","title":"title","duration":"15 min","objective":"obj","drill":"instructions","parent_tip":"tip"},{"day":"Day 2","title":"title","duration":"15 min","objective":"obj","drill":"instructions","parent_tip":"tip"},{"day":"Day 3","title":"title","duration":"15 min","objective":"obj","drill":"instructions","parent_tip":"tip"},{"day":"Day 4","title":"Watch and Learn","duration":"20 min","objective":"Game IQ","drill":"YouTube guidance","parent_tip":"conversation starter"},{"day":"Day 5","title":"title","duration":"15 min","objective":"obj","drill":"instructions","parent_tip":"tip"},{"day":"Day 6","title":"title","duration":"15 min","objective":"obj","drill":"instructions","parent_tip":"tip"},{"day":"Day 7","title":"Challenge","duration":"20 min","objective":"celebrate","drill":"fun challenge","parent_tip":"celebrate"}],"local_events":[{"type":"Live game","title":"title","description":"description"},{"type":"Clinic","title":"title","description":"description"}],"online_resources":[{"type":"YouTube","title":"title","description":"description"},{"type":"USA Lacrosse","title":"title","description":"description"}],"parent_note":"2 sentences","next_step":"one action"}`;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content && data.content[0] ? data.content[0].text : '';
    const clean = text.replace(/```json|```/g, '').trim();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
      body: JSON.stringify({ result: clean }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
