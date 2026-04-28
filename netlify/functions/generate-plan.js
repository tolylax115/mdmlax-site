exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    const { answers, playerName, parentName, parentEmail, zip } = body;

    const prompt = `You are a 10U lacrosse coach. Player: ${playerName}, Parent: ${parentName}, Zip: ${zip||'n/a'}, Experience: ${answers.experience}, Struggles: ${(answers.struggles||[]).join(', ')}, Strengths: ${(answers.strengths||[]).join(', ')}, Position: ${answers.position}, Days: ${answers.days}, Equipment: ${answers.equipment}, Setting: ${answers.setting}, Goal: ${answers.goal}, Parent exp: ${answers.parent_exp}.

Respond ONLY with this JSON and nothing else — no markdown, no backticks:
{"headline":"string","skill_level_label":"First Steps","skill_level_summary":"string","top_focus":"string","why_this_focus":"string","skill_breakdown":[{"skill":"Catching","status":"needs work","note":"string"},{"skill":"Throwing","status":"developing","note":"string"},{"skill":"Ground balls","status":"needs work","note":"string"},{"skill":"Cradling","status":"developing","note":"string"},{"skill":"Field sense","status":"needs work","note":"string"}],"week_plan":[{"day":"Day 1","title":"string","duration":"15 min","objective":"string","drill":"string","parent_tip":"string"},{"day":"Day 2","title":"string","duration":"15 min","objective":"string","drill":"string","parent_tip":"string"},{"day":"Day 3","title":"string","duration":"15 min","objective":"string","drill":"string","parent_tip":"string"},{"day":"Day 4","title":"Watch and Learn","duration":"20 min","objective":"Game IQ","drill":"string","parent_tip":"string"},{"day":"Day 5","title":"string","duration":"15 min","objective":"string","drill":"string","parent_tip":"string"},{"day":"Day 6","title":"string","duration":"15 min","objective":"string","drill":"string","parent_tip":"string"},{"day":"Day 7","title":"Week challenge","duration":"20 min","objective":"celebrate","drill":"string","parent_tip":"string"}],"local_events":[{"type":"Live game","title":"string","description":"string"},{"type":"Clinic","title":"string","description":"string"}],"online_resources":[{"type":"YouTube","title":"string","description":"string"},{"type":"USA Lacrosse","title":"string","description":"string"}],"parent_note":"string","next_step":"string"}`;

    // Call Anthropic API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content && data.content[0] ? data.content[0].text : '';
    const clean = text.replace(/```json|```/g, '').trim();

    // Send lead to Kit using V3 API (more reliable with API keys)
    if (parentEmail && process.env.KIT_API_KEY && process.env.KIT_FORM_ID) {
      fetch(`https://api.convertkit.com/v3/forms/${process.env.KIT_FORM_ID}/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: process.env.KIT_API_KEY,
          email: parentEmail,
          first_name: parentName,
          fields: {
            player_name: playerName,
            zip_code: zip || '',
          }
        }),
      }).catch(err => console.log("Kit error:", err.message));
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
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
