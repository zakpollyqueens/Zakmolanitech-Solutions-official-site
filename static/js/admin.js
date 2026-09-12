document.addEventListener("DOMContentLoaded", async () => {
  const URL = "https://julhswsijtcoyjrjrobk.supabase.co";
  const KEY = "sb_publishable_a0qKsqBB0hR9BOWpP3dkwg_7nUOmXYC";
  const form = document.getElementById("adminLoginForm");
  const email = document.getElementById("adminEmail");
  const password = document.getElementById("adminPassword");
  const status = document.getElementById("adminLoginStatus");

  if (!form) return;

  const setStatus = (message, error = false) => {
    if (status) {
      status.textContent = message;
      status.style.color = error ? "#ff8f8f" : "#91a7ba";
    }
  };

  const loadSupabase = () =>
    new Promise((resolve, reject) => {
      if (window.supabase?.createClient) return resolve();

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      script.onload = resolve;
      script.onerror = () => reject(new Error("Unable to load authentication system."));
      document.head.appendChild(script);
    });

  try {
    await loadSupabase();

    const client = window.supabase.createClient(URL, KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    const verifyAdmin = async () => {
      const { data, error } = await client.rpc("is_admin");
      return !error && data === true;
    };

    const { data } = await client.auth.getSession();

    if (data.session?.user) {
      setStatus("Checking administrator access...");
      if (await verifyAdmin()) return (window.location.href = "admin-dashboard.html");

      await client.auth.signOut();
      setStatus("This account does not have administrator access.", true);
    }

    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (form.dataset.busy === "true") return;
      form.dataset.busy = "true";

      const userEmail = email.value.trim();
      const userPassword = password.value;
      const button = form.querySelector("button");
      const originalText = button?.textContent || "ACCESS DASHBOARD →";

      if (!userEmail || !userPassword) {
        setStatus("Please enter your administrator email and password.", true);
        form.dataset.busy = "false";
        return;
      }

      if (button) {
        button.disabled = true;
        button.textContent = "VERIFYING ACCESS...";
      }

      setStatus("Signing in securely...");

      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: userEmail,
          password: userPassword
        });

        if (error) {
          const message = error.message?.toLowerCase().includes("invalid login")
            ? "Incorrect administrator email or password."
            : error.message?.toLowerCase().includes("rate limit")
              ? "Too many login attempts. Please wait and try again."
              : error.message || "Unable to sign in.";

          return setStatus(message, true);
        }

        if (!data?.user) return setStatus("Login failed. No authenticated account was returned.", true);

        setStatus("Verifying administrator privileges...");

        if (!(await verifyAdmin())) {
          await client.auth.signOut();
          return setStatus("Access denied. This account is not an administrator.", true);
        }

        setStatus("Access approved. Opening Control Center...");
        window.location.href = "admin-dashboard.html";
      } catch (error) {
        console.error("Admin authentication error:", error);
        setStatus("A connection error occurred. Please try again.", true);
      } finally {
        form.dataset.busy = "false";
        if (button) {
          button.disabled = false;
          button.textContent = originalText;
        }
      }
    });
  } catch (error) {
    console.error(error);
    setStatus("Authentication system could not be loaded. Please refresh the page.", true);
  }
});
