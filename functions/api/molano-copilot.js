const MOLANO_URL = "https://molanoai.zakpollyqueens.workers.dev/api/support-chat";
const SUPABASE_URL = "https://jjcptobdzreckuhtcuzm.supabase.co";
const SUPABASE_KEY = "sb_publishable_5AyVE6y2FGY8S_NoLC5a-w_URf-Mfxc";
const ALLOWED = ["admin","manager","staff","architect","chairperson","vice_chairperson","support"];
const json = (body,status=200) => new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
export async function onRequestPost({request}) {
  const auth = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+/i.test(auth)) return json({error:"Staff sign-in is required."},401);
  let body;
  try { body=await request.json(); } catch { return json({error:"Send a valid draft request."},400); }
  if (!Array.isArray(body.messages) || !body.messages.length || body.messages.length>10) return json({error:"A short conversation context is required."},400);
  const messages=body.messages.map(m=>({role:m&&m.role,content:typeof(m&&m.content)==="string"?m.content.slice(0,3000):""})).filter(m=>(m.role==="user"||m.role==="assistant")&&m.content.trim());
  if (!messages.length || messages[messages.length-1].role!=="user") return json({error:"The support request is missing."},400);
  try {
    const verified=await fetch(SUPABASE_URL+"/auth/v1/user",{headers:{apikey:SUPABASE_KEY,authorization:auth},signal:AbortSignal.timeout(5000)});
    if(!verified.ok)return json({error:"Your staff session is invalid or expired. Sign in again."},401);
    const user=await verified.json();
    const role=user&&user.app_metadata&&user.app_metadata.staff_role;
    if(!user.id || !ALLOWED.includes(role))return json({error:"This account is not authorized to use the staff copilot."},403);
    const upstream=await fetch(MOLANO_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({product:"ZakiTech internal customer-support reply drafting. You are assisting authorized staff. Use only the conversation excerpts supplied; never invent actions, policies, prices, ticket status, or account changes. Produce a concise, empathetic reply the staff member can review and send.",messages})});
    const data=await upstream.json().catch(()=>({error:"Molano AI returned an unreadable response."}));
    return json(data,upstream.status);
  } catch { return json({error:"Molano AI could not be reached. Please try again."},502); }
}
