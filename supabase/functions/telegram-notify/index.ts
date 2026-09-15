import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const auth = req.headers.get("Authorization");

  if (!auth?.startsWith("Bearer ")) {
    return json({ error: "Authentication required" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: {
          Authorization: auth,
        },
      },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return json({ error: "Invalid session" }, 401);
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_admin");

  if (adminError || !isAdmin) {
    return json(
      { error: "Administrator permission required" },
      403,
    );
  }

  let body: {
    text?: string;
    chatId?: string;
    parseMode?: string;
  };

  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const text = String(body.text ?? "").trim();

  if (!text) {
    return json({ error: "Message text is required" }, 400);
  }

  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const defaultChatId = Deno.env.get("TELEGRAM_CHAT_ID");

  const chatId = String(
    body.chatId ?? defaultChatId ?? "",
  ).trim();

  if (!botToken || !chatId) {
    return json(
      { error: "Telegram secrets are not configured" },
      500,
    );
  }

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode:
          body.parseMode === "Markdown" ||
          body.parseMode === "HTML"
            ? body.parseMode
            : undefined,
        disable_web_page_preview: true,
      }),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    return json(
      {
        error:
          result?.description ??
          "Telegram request failed",
      },
      502,
    );
  }

  return json({
    ok: true,
    messageId: result.result?.message_id ?? null,
  });
});
