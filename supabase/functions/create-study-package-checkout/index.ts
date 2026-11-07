import { createClient } from "npm:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const env=(k)=>Deno.env.get(k)||"";
function adminClient(){const url=env("SUPABASE_URL");let key=env("SUPABASE_SERVICE_ROLE_KEY");if(!key){try{key=JSON.parse(env("SUPABASE_SECRET_KEYS")).default||""}catch{}}if(!url||!key)throw new Error("Supabase server credentials are unavailable.");return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 try{
  const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");if(!token)return reply({error:"Sign in before choosing a package."},401);
  const db=adminClient(),auth=await db.auth.getUser(token),user=auth.data?.user;if(auth.error||!user)return reply({error:"Your session is invalid. Please sign in again."},401);
  const body=await req.json(),packageId=String(body.package_id||""),method=String(body.payment_method||"jjuma");
  if(!["one-session","two-sessions","seven-sessions","fourteen-sessions","twenty-eight-sessions"].includes(packageId))return reply({error:"Choose a valid lesson package."},400);
  if(!["jjuma","airtel_manual"].includes(method))return reply({error:"Unsupported payment method."},400);
  const got=await db.from("study_package_catalog").select("id,title,session_count,price_ugx").eq("id",packageId).eq("active",true).maybeSingle();
  if(got.error||!got.data)return reply({error:"This package is no longer available."},404);
  const pack=got.data;
  const activeSub=await db.from("study_package_subscriptions").select("id").eq("student_id",user.id).eq("status","active").limit(1).maybeSingle();
  if(activeSub.data)return reply({error:"You already have an active lesson package. Finish its scheduled sessions before purchasing another package."},409);
  const pendingSub=await db.from("study_package_subscriptions").select("id,status").eq("student_id",user.id).eq("package_id",packageId).eq("status","pending_payment").maybeSingle();
  if(pendingSub.data){
   const pendingPay=await db.from("study_package_payments").select("id,provider,provider_payload").eq("subscription_id",pendingSub.data.id).eq("status","pending").maybeSingle();
   if(pendingPay.data?.provider==="jjuma"&&method==="jjuma"&&pendingPay.data.provider_payload?.payment_url)return reply({payment_url:pendingPay.data.provider_payload.payment_url,reused:true});
   if(pendingPay.data)return reply({error:"A payment for this package is already awaiting confirmation."},409);
  }
  const created=await db.from("study_package_subscriptions").insert({student_id:user.id,package_id:pack.id,total_sessions:pack.session_count,amount_paid:pack.price_ugx,currency:"UGX",status:"pending_payment"}).select("id").single();
  if(created.error)return reply({error:"Could not create package subscription: "+created.error.message},500);
  const subscriptionId=created.data.id;
  if(method==="airtel_manual"){
   const reference=String(body.transaction_reference||"").trim().toUpperCase().replace(/\s+/g,"");
   if(reference.length<6||reference.length>80||!/^[A-Z0-9-]+$/.test(reference))return reply({error:"Enter the Airtel Money transaction ID exactly as shown in your payment confirmation."},400);
   const saved=await db.from("study_package_payments").insert({subscription_id:subscriptionId,student_id:user.id,provider:"airtel_money_manual",provider_reference:reference,amount:pack.price_ugx,currency:"UGX",status:"pending",provider_payload:{merchant_code:"7171832",verification:"awaiting_staff_reconciliation"}}).select("id").single();
   if(saved.error)return reply({error:saved.error.message},409);
   return reply({status:"pending",message:"Your Airtel transaction reference has been submitted. Staff will verify payment before activating your package."});
  }
  const secret=env("JJUMA_SECRET_KEY");if(!secret)return reply({error:"JJuma checkout is not configured: JJUMA_SECRET_KEY is missing."},503);
  const payment=await db.from("study_package_payments").insert({subscription_id:subscriptionId,student_id:user.id,provider:"jjuma",amount:pack.price_ugx,currency:"UGX",status:"pending",provider_payload:{state:"creating_checkout"}}).select("id").single();
  if(payment.error)return reply({error:"Could not create payment record: "+payment.error.message},500);
  const origin=req.headers.get("origin")||"",redirectUrl=origin?origin.replace(/\/$/,"")+"/templates/study.html?payment=return":undefined;
  const apiBody={amount:Number(pack.price_ugx),currency:"UGX",description:"Study package: "+pack.title,customer_name:String(user.user_metadata?.full_name||user.email||"Zakmolanitech student").slice(0,120),customer_email:user.email||undefined,redirect_url:redirectUrl,return_url:redirectUrl,external_order_id:payment.data.id,idempotency_key:payment.data.id,metadata:{study_package_payment_id:payment.data.id,subscription_id:subscriptionId,student_id:user.id,package_id:pack.id}};
  let providerResponse;
  try{const response=await fetch("https://api.jjuma.com/api/v1/payments/create",{method:"POST",headers:{"Authorization":"Bearer "+secret,"Content-Type":"application/json"},body:JSON.stringify(apiBody)});providerResponse=await response.json();if(!response.ok||providerResponse.status==="error")throw new Error(providerResponse.message||providerResponse.error||"JJuma rejected the checkout request.");}
  catch(error){await db.from("study_package_payments").update({status:"failed",provider_payload:{error:String(error).slice(0,500)}}).eq("id",payment.data.id);await db.from("study_package_subscriptions").update({status:"cancelled"}).eq("id",subscriptionId);return reply({error:"JJuma checkout could not be started: "+String(error).slice(0,220)},502)}
  const data=providerResponse.data||providerResponse,url=String(data.payment_url||data.checkout_url||"");
  if(!/^https:\/\/pay\.jjuma\.com\//i.test(url)){await db.from("study_package_payments").update({status:"failed",provider_payload:{provider_response:providerResponse}}).eq("id",payment.data.id);return reply({error:"JJuma did not return a valid hosted checkout URL."},502)}
  const saved=await db.from("study_package_payments").update({provider_reference:String(data.reference||data.transaction_id||"")||null,provider_payload:{transaction_id:data.transaction_id||null,reference:data.reference||null,payment_url:url,provider_status:data.status||"pending"}}).eq("id",payment.data.id);
  if(saved.error)return reply({error:"Checkout created but payment details could not be saved."},500);
  return reply({payment_url:url,status:"pending"});
 }catch(error){return reply({error:String(error?.message||error)},500)}
});