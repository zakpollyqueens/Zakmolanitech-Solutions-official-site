const MOLANO_URL = "https://molanoai.zakpollyqueens.workers.dev/api/support-chat";
const json = (body, status=200) => new Response(JSON.stringify(body), { status, headers: { "content-type":"application/json; charset=utf-8", "cache-control":"no-store" } });
export async function onRequestPost({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error:"Send a valid support message." },400); }
  if (!Array.isArray(body.messages) || !body.messages.length || body.messages.length > 10) return json({ error:"A support conversation is required." },400);
  const messages = body.messages.map(m => ({ role:m && m.role, content:typeof (m && m.content)==="string" ? m.content.slice(0,3000) : "" })).filter(m => (m.role==="user" || m.role==="assistant") && m.content.trim());
  if (!messages.length || messages[messages.length-1].role!=="user") return json({ error:"Write a message before sending." },400);
  try {
    const upstream = await fetch(MOLANO_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({product:"ZakiTech customer portal, client workstation, projects, account access and support",messages})});
    const data = await upstream.json().catch(()=>({error:"Molano AI returned an unreadable response."}));
    return json(data,upstream.status);
  } catch { return json({error:"Molano AI is temporarily unreachable. Please use Contact Support to reach the team."},502); }
}
