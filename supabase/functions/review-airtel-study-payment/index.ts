import { createClient } from "npm:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const env=(k)=>Deno.env.get(k)||"";
function adminClient(){const url=env("SUPABASE_URL");let key=env("SUPABASE_SERVICE_ROLE_KEY");if(!key){try{key=JSON.parse(env("SUPABASE_SECRET_KEYS")).default||""}catch{}}if(!url||!key)throw new Error("Supabase server credentials are unavailable.");return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 try{
  const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");if(!token)return reply({error:"Sign in required."},401);
  const db=adminClient(),auth=await db.auth.getUser(token),user=auth.data?.user;if(auth.error||!user)return reply({error:"Invalid session."},401);
  const role=user.app_metadata?.staff_role;if(!["admin","manager","staff","architect"].includes(role))return reply({error:"Authorised staff only."},403);
  const body=await req.json(),id=String(body.payment_id||""),action=String(body.action||"");
  if(!/^[0-9a-f-]{36}$/i.test(id)||!["confirm","reject"].includes(action))return reply({error:"Invalid review request."},400);
  let got=await db.from("study_payments").select("*").eq("id",id).eq("provider","airtel_money_manual").maybeSingle(),isPackagePayment=false;
  if(!got.data){got=await db.from("study_package_payments").select("*").eq("id",id).eq("provider","airtel_money_manual").maybeSingle();isPackagePayment=!!got.data;}
  if(got.error||!got.data)return reply({error:"Airtel payment record not found."},404);
  const payment=got.data;if(payment.status!=="pending")return reply({error:"This payment has already been reviewed."},409);
  if(action==="confirm"){
   const upd=await db.from(isPackagePayment?"study_package_payments":"study_payments").update({status:"completed",paid_at:new Date().toISOString(),provider_payload:{...payment.provider_payload,verification:"staff_confirmed",verified_by:user.id,verified_at:new Date().toISOString()}}).eq("id",id).eq("status","pending").select("id").maybeSingle();
   if(upd.error||!upd.data)return reply({error:"Payment could not be confirmed."},500);
   if(isPackagePayment){
    const activated=await db.from("study_package_subscriptions").update({status:"active",purchased_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",payment.subscription_id).eq("student_id",payment.student_id).eq("status","pending_payment");
    if(activated.error)return reply({error:"Payment confirmed but package activation needs reconciliation."},500);
    return reply({confirmed:true,package_activated:true});
   }
   const en=await db.from("study_enrollments").update({status:"confirmed",updated_at:new Date().toISOString()}).eq("id",payment.enrollment_id).eq("student_id",payment.student_id).eq("status","pending_payment");
   if(en.error)return reply({error:"Payment confirmed but enrolment activation needs reconciliation."},500);
   return reply({confirmed:true});
  }
  const upd=await db.from(isPackagePayment?"study_package_payments":"study_payments").update({status:"failed",provider_payload:{...payment.provider_payload,verification:"staff_rejected",reviewed_by:user.id,reviewed_at:new Date().toISOString()}}).eq("id",id).eq("status","pending");
  if(upd.error)return reply({error:"Payment could not be rejected."},500);
  return reply({rejected:true});
 }catch(error){return reply({error:String(error?.message||error)},500)}
});