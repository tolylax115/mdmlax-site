exports.handler = async function (event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    const answers = body.answers;
    const playerName = body.playerName;
    const parentName = body.parentName;
    const zip = body.zip || 'not provided';

    const prompt = `You are a 10U lacrosse coach. Respond ONLY with valid JSON, no markdown, no backticks.

Player: ${playerName}, Parent: ${parentName}, Zip: ${zip}
Experience: ${answers.experience}
Struggles: ${(answers.struggles||[]).join(', ')}
Strengths: ${(answers.strengths||[]).join(', ')}
Position: ${answers.position}, Days: ${answers.days}, Equipment: ${answers.equipment}
Setting: ${answers.setting}, Goal: ${answers.goal}, Parent exp: ${answers.parent_exp}

Return this exact JSON structure:
{"headline":"encouraging sentence to parent about player","skill_level_label":"First Steps","skill_level_summary":"2 sentences","top_focus":"skill phrase","why_this_focus":"1 sentence","skill_breakdown":[{"skill":"Catching","status":"needs work","note":"note"},{"skill":"Throwing","status":"developing","note":"note"},{"skill":"Ground balls","status":"needs work","note":"note"},{"skill":"Cradling","status":"developing","note":"note"},{"skill":"Field sense","status":"needs work","note":"note"}],"week_plan":[{"day":"Day 1","title":"title","duration":"15 min","objective":"obj","drill":"detailed drill instructions","parent_tip":"tip"},{"day":"Day 2","title":"title","duration":"15 min","objective":"obj","drill":"detailed drill instructions","parent_tip":"tip"},{"day":"Day 3","title":"title","duration":"15 min","objective":"obj","drill":"detailed drill instructions","parent_tip":"tip"},{"day":"Day 4","title":"Watch and Learn","duration":"20 min","objective":"Game IQ","drill":"what to find on YouTube and what to watch for","parent_tip":"conversation starter"},{"day":"Day 5","title":"title","duration":"15 min","objective":"obj","drill":"detailed drill instructions","parent_tip":"tip"},{"day":"Day 6","title":"title","duration":"15 min","objective":"obj","drill":"detailed drill instructions","parent_tip":"tip"},{"day":"Day 7","title":"Week challenge","duration":"20 min","objective":"celebrate","drill":"fun challenge description","parent_tip":"how to celebrate"}],"local_events":[{"type":"Live game","title":"College lacrosse nearby","description":"search guidance for ${zip}"},{"type":"Clinic","title":"Youth lacrosse clinic","description":"how to find 10U clinics via USA Lacrosse"}],"online_resources":[{"type":"YouTube","title":"search terms to use","description":"why this helps at this level"},{"type":"USA Lacrosse","title":"USALacrosse.org","description":"specific resource for 10U development"}],"parent_note":"2 warm sentences for the parent about their role","next_step":"one specific action after this week"}`;

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

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
