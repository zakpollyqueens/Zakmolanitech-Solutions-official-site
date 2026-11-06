# Zakmolanitech Solutions — Supabase email templates

Branded HTML templates for the hosted Supabase Auth project.

## Files and suggested subjects

- `confirm-signup.html` — Confirm your Zakmolanitech Solutions account
- `reset-password.html` — Reset your Zakmolanitech Solutions password
- `magic-link.html` — Your secure Zakmolanitech Solutions sign-in link
- `change-email.html` — Confirm your new email address
- `password-changed-notification.html` — Your password was changed (optional security notification)

The four authentication templates use Supabase's `{{ .ConfirmationURL }}` variable. Keep it unchanged. Supabase generates and verifies this one-time URL; do not replace it with a manually constructed link.

## Apply the four authentication templates

1. Open the Supabase project dashboard for the Zakmolanitech Solutions website.
2. Go to **Authentication → Emails → Templates**.
3. Open Confirm signup, Reset password, Magic link, and Change email address one at a time.
4. Paste the complete HTML from the corresponding file in this folder into the message editor.
5. Set the suggested subject above and save.
6. Keep `{{ .ConfirmationURL }}` exactly as written.

## Redirect configuration

In **Authentication → URL Configuration**, set the Site URL to:

`https://zakmolanitech-solutions.pages.dev`

Ensure the allowed redirect URLs include:

- `https://zakmolanitech-solutions.pages.dev/templates/dashboard.html`
- `https://zakmolanitech-solutions.pages.dev/templates/settings.html`

The signup flow currently uses the configured Site URL. The password-reset flow explicitly returns users to the settings page. Keep those routes consistent with the application.

## SMTP and sending

The project currently uses Supabase's built-in email delivery. This is suitable for initial testing, but it has strict sending limits and is not the recommended production delivery setup.

Custom SMTP is separate from the HTML templates. Do not use the shared `pages.dev` hostname as an authenticated sender domain: it is not a domain controlled by this project, so its email DNS records cannot be independently verified. When the company owns a custom domain, verify it with an email provider, configure the provider's DNS records, and then enter its SMTP credentials in Supabase **Authentication → Emails → SMTP Settings**. Never commit SMTP credentials or provider API keys to this repository.

## Optional security notification

The password-changed notification file is a branded reference. Configure it only if the corresponding notification template is available in the hosted Supabase dashboard. It is separate from the four sign-in and verification templates.

## Test checklist

- Register a controlled test account and confirm the email link returns to the website.
- Request a password reset and confirm the link returns to the settings page.
- Check the email on mobile and desktop.
- Check the fallback link in the message.
- Test magic-link and email-change messages only if those flows are enabled in the application.
