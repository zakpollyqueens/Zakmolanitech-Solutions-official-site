import { createClient } from "npm:@supabase/supabase-js@2";
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}});
const env=(k)=>Deno.env.get(k)||"";
function adminClient(){const url=env("SUPABASE_URL");let key=env("SUPABASE_SERVICE_ROLE_KEY");if(!key){try{key=JSON.parse(env("SUPABASE_SECRET_KEYS")).default||""}catch{}}if(!url||!key)throw new Error("Supabase server credentials are unavailable.");return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
function hex(bytes){return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function safeEqual(a,b){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
Deno.serve(async(req)=>{
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 try{
  const secret=env("JJUMA_WEBHOOK_SECRET");if(!secret)return reply({error:"Webhook secret is not configured."},503);
  const raw=await req.text(),timestamp=req.headers.get("X-Jjuma-Timestamp")||"",signature=(req.headers.get("X-Jjuma-Signature")||"").replace(/^sha256=/i,"").toLowerCase();
  if(!timestamp||!/^[a-f0-9]{64}$/.test(signature))return reply({error:"Missing or invalid webhook signature headers."},401);
  const ts=Number(timestamp),stampMs=Number.isFinite(ts)?(ts<1e12?ts*1000:ts):Date.parse(timestamp);
  if(!Number.isFinite(stampMs)||Math.abs(Date.now()-stampMs)>5*60*1000)return reply({error:"Webhook timestamp is outside the accepted window."},401);
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const digest=hex(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(timestamp+"."+raw)));
  if(!safeEqual(digest,signature))return reply({error:"Webhook signature verification failed."},401);
  const event=JSON.parse(raw),eventName=String(event.event||req.headers.get("X-Jjuma-Event")||"");
  const ref=String(event.reference||event.tx_ref||event.reference_code||"");
  const transactionId=String(event.transaction_id||"");
  if(!ref&&!transactionId)return reply({error:"Webhook has no transaction reference."},400);
  const db=adminClient();
  let payment=null,isPackagePayment=false;
  const paymentId=String(event.metadata?.study_payment_id||event.metadata?.study_package_payment_id||event.metadata?.payment_id||"");
  if(paymentId){const byId=await db.from("study_payments").select("*").eq("id",paymentId).eq("provider","jjuma").maybeSingle();payment=byId.data||null;
   if(!payment){const packageById=await db.from("study_package_payments").select("*").eq("id",paymentId).eq("provider","jjuma").maybeSingle();payment=packageById.data||null;isPackagePayment=!!payment;}}
  if(!payment&&ref){const byRef=await db.from("study_payments").select("*").eq("provider","jjuma").eq("provider_reference",ref).maybeSingle();payment=byRef.data||null;
   if(!payment){const packageByRef=await db.from("study_package_payments").select("*").eq("provider","jjuma").eq("provider_reference",ref).maybeSingle();payment=packageByRef.data||null;isPackagePayment=!!payment;}}
  if(!payment&&transactionId){const byTx=await db.from("study_payments").select("*").eq("provider","jjuma").filter("provider_payload->>transaction_id","eq",transactionId).maybeSingle();payment=byTx.data||null;
   if(!payment){const packageByTx=await db.from("study_package_payments").select("*").eq("provider","jjuma").filter("provider_payload->>transaction_id","eq",transactionId).maybeSingle();payment=packageByTx.data||null;isPackagePayment=!!payment;}}
  if(!payment)return reply({received:true,matched:false,message:"No matching study payment."},200);
  if(payment.status==="completed")return reply({received:true,already_processed:true});
  const eventStatus=String(event.status||event.payment_status||"").toLowerCase();
  if(["payment.failed","payment.cancelled"].includes(eventName)||["failed","cancelled","canceled"].includes(eventStatus)){
   const failed=await db.from(isPackagePayment?"study_package_payments":"study_payments").update({status:"failed",provider_payload:{...payment.provider_payload,provider_event:eventName||eventStatus,failed_at:new Date().toISOString()}}).eq("id",payment.id).eq("status","pending");
   if(failed.error)return reply({error:"Could not record the failed checkout event."},500);
   return reply({received:true,failed:true});
  }
  if(eventName!=="payment.completed"&&eventStatus!=="successful")return reply({received:true,ignored:true});
  const txId=transactionId||String(payment.provider_payload?.transaction_id||"");
  if(!txId)return reply({error:"Transaction ID is missing; manual reconciliation required."},422);
  const apiSecret=env("JJUMA_SECRET_KEY");if(!apiSecret)return reply({error:"JJuma API secret is not configured."},503);
  const verifyRes=await fetch("https://api.jjuma.com/api/v1/payments/verify/"+encodeURIComponent(txId),{headers:{"Authorization":"Bearer "+apiSecret}});
  const verifyJson=await verifyRes.json();if(!verifyRes.ok)return reply({error:"Provider verification request failed."},502);
  const verified=verifyJson.data||verifyJson,verifiedStatus=String(verified.status||verified.payment_status||"").toLowerCase();
  const verifiedRef=String(verified.reference||verified.reference_code||verified.tx_ref||"");
  const verifiedAmount=Number(verified.amount),verifiedCurrency=String(verified.currency||"").toUpperCase();
  if(!["successful","success","completed","paid"].includes(verifiedStatus))return reply({received:true,verified:false,status:verifiedStatus});
  if(verifiedAmount!==Number(payment.amount)||verifiedCurrency!==payment.currency.toUpperCase()||(ref&&verifiedRef&&verifiedRef!==ref))return reply({error:"Verified amount, currency or reference does not match the study payment."},409);
  const updated=await db.from(isPackagePayment?"study_package_payments":"study_payments").update({status:"completed",paid_at:new Date().toISOString(),provider_payload:{...payment.provider_payload,verified_status:verifiedStatus,verified_at:new Date().toISOString(),webhook_event:eventName,transaction_id:txId}}).eq("id",payment.id).eq("status","pending").select("id").maybeSingle();
  if(updated.error)return reply({error:"Could not record the verified payment."},500);
  if(!updated.data)return reply({received:true,already_processed:true});
  if(isPackagePayment){
   const activated=await db.from("study_package_subscriptions").update({status:"active",purchased_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",payment.subscription_id).eq("student_id",payment.student_id).eq("status","pending_payment");
   if(activated.error)return reply({error:"Payment verified but package activation needs staff reconciliation."},500);
   return reply({received:true,completed:true,package_activated:true});
  }
  const enrollment=await db.from("study_enrollments").update({status:"confirmed",updated_at:new Date().toISOString()}).eq("id",payment.enrollment_id).eq("student_id",payment.student_id).eq("status","pending_payment");
  if(enrollment.error)return reply({error:"Payment verified but enrolment activation needs staff reconciliation."},500);
  return reply({received:true,completed:true});
 }catch(error){return reply({error:String(error?.message||error)},500)}
});