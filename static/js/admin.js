document.addEventListener("DOMContentLoaded",async()=>{
  const URL="https://julhswsijtcoyjrjrobk.supabase.co";
  const KEY="sb_publishable_a0qKsqBB0hR9BOWpP3dkwg_7nUOmXYC";

  const form=document.getElementById("adminLoginForm");
  const email=document.getElementById("adminEmail");
  const password=document.getElementById("adminPassword");
  const status=document.getElementById("adminLoginStatus");

  if(!form)return;

  const msg=(text,error=false)=>{
    if(status){
      status.textContent=text;
      status.style.color=error?"#ff8f8f":"#91a7ba";
    }
  };

  if(!window.supabase?.createClient){
    msg("Supabase library failed to load.",true);
    return;
  }

  const client=window.supabase.createClient(URL,KEY,{
    auth:{
      persistSession:true,
      autoRefreshToken:true,
      detectSessionInUrl:false
    }
  });

  form.addEventListener("submit",async e=>{
    e.preventDefault();

    const userEmail=email.value.trim();
    const userPassword=password.value;

    if(!userEmail||!userPassword){
      msg("Enter your email and password.",true);
      return;
    }

    const button=form.querySelector("button");
    if(button)button.disabled=true;

    try{
      msg("Signing in...");

      const login=await client.auth.signInWithPassword({
        email:userEmail,
        password:userPassword
      });

      console.log("LOGIN RESULT:",login);

      if(login.error){
        msg("LOGIN ERROR: "+login.error.message,true);
        return;
      }

      if(!login.data?.session){
        msg("LOGIN RETURNED NO SESSION.",true);
        return;
      }

      msg("Login successful. Checking administrator permission...");

      const adminCheck=await client.rpc("is_admin");

      console.log("ADMIN CHECK:",adminCheck);

      if(adminCheck.error){
        msg("ADMIN CHECK ERROR: "+adminCheck.error.message,true);
        return;
      }

      if(adminCheck.data!==true){
        msg("LOGIN WORKS, BUT is_admin() RETURNED: "+String(adminCheck.data),true);
        return;
      }

      const sessionCheck=await client.auth.getSession();

      console.log("SESSION AFTER LOGIN:",sessionCheck);

      if(!sessionCheck.data?.session){
        msg("LOGIN WORKED, BUT THE SESSION WAS NOT PERSISTED.",true);
        return;
      }

      msg("SUCCESS — AUTHENTICATED ADMIN SESSION IS WORKING. Opening dashboard...");
      setTimeout(()=>{location.href="admin-dashboard.html";},300);
    }catch(error){
      console.error("AUTH TEST ERROR:",error);
      msg("AUTH ERROR: "+(error?.message||error),true);
    }finally{
      if(button)button.disabled=false;
    }
  });
});
