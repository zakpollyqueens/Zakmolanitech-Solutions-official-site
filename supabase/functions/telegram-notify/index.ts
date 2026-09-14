const BOT_TOKEN=Deno.env.get("TELEGRAM_BOT_TOKEN")||"";
const DEFAULT_CHAT_ID=Deno.env.get("TELEGRAM_CHAT_ID")||"";
const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Content-Type":"application/json"};

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:CORS});
  try{
    if(!BOT_TOKEN)return new Response(JSON.stringify({ok:false,error:"Telegram bot token is not configured"}),{status:500,headers:CORS});
    const body=await req.json();
    const message=String(body.message||"").trim();
    const chat_id=String(body.chat_id||DEFAULT_CHAT_ID).trim();
    if(!message)return new Response(JSON.stringify({ok:false,error:"Message is required"}),{status:400,headers:CORS});
    if(!chat_id)return new Response(JSON.stringify({ok:false,error:"Telegram chat ID is required"}),{status:400,headers:CORS});
    const r=await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({chat_id,text:message,parse_mode:"HTML"})
    });
    const data=await r.json();
    return new Response(JSON.stringify(data),{status:r.ok?200:r.status,headers:CORS});
  }catch(e){
    return new Response(JSON.stringify({ok:false,error:String(e)}),{status:500,headers:CORS});
  }
})
