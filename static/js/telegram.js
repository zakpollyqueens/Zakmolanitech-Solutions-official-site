(function(){
  const SUPABASE_URL="https://julhswsijtcoyjrjrobk.supabase.co";
  const SUPABASE_KEY="sb_publishable_a0qKsqBB0hR9BOWpP3dkwg_7nUOmXYC";
  let clientPromise;

  async function client(){
    if(!clientPromise){
      clientPromise=new Promise((resolve,reject)=>{
        if(window.supabase?.createClient){
          resolve(window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY));
          return;
        }
        const s=document.createElement("script");
        s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        s.onload=()=>resolve(
          window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY)
        );
        s.onerror=()=>reject(
          new Error("Unable to load Supabase.")
        );
        document.head.appendChild(s);
      });
    }
    return clientPromise;
  }

  window.ZakTelegram={
    async send(text,options={}){
      const db=await client();

      const {data:{session}}=await db.auth.getSession();

      if(!session){
        throw new Error("Please sign in first.");
      }

      const {data,error}=await db.functions.invoke(
        "telegram-notify",
        {
          body:{
            text,
            chatId:options.chatId||undefined,
            parseMode:options.parseMode||undefined
          }
        }
      );

      if(error) throw error;
      if(data?.error) throw new Error(data.error);

      return data;
    }
  };
})();
