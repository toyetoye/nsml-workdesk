# Outlook capture add-in

One-click capture of an open email into WorkDesk, with no admin access required.
The add-in reads the **currently open message only** (via Office.js, not a
mailbox-wide Graph permission), and posts it to an authenticated ingest
endpoint. Nothing is ever sent on your behalf; the red-team and manual-copy
gates on the output side are untouched.

## How it fits together

- `public/outlook-addin/manifest.xml` — the file you sideload into Outlook. It
  adds a **Send to WorkDesk** button to the message-read ribbon.
- `public/outlook-addin/taskpane.html` + `taskpane.js` — the pane that opens
  when you click the button. It reads the open message and POSTs it.
- `src/app/api/ingest/route.ts` — receives the POST, authenticates with a
  bearer token, synthesizes an `.eml`, and runs it through the existing
  `ingestEmlEvidence` pipeline (threading, thread/message creation, case link).
- `src/lib/email-ingestion/compose-eml.ts` — turns the structured fields into a
  valid RFC822 message so the parser path is reused unchanged.

The pipe is one-directional and read-only. The add-in holds no Graph token.

## One-time setup

1. **Set the secret.** Generate a long random value and set `NSML_INGEST_SECRET`
   in your deployment environment (e.g. `openssl rand -base64 32`). The route
   fails closed if it is unset.

2. **Deploy WorkDesk.** The add-in's static files are served from
   `https://<your-domain>/outlook-addin/...`. Confirm `manifest.xml`,
   `taskpane.html`, and the icons under `assets/` load over HTTPS.

3. **Point the manifest at your domain.** Replace every
   `https://nsml-workdesk.vercel.app` in `manifest.xml` with your production
   domain if it differs.

4. **Sideload the add-in (no admin).**
   - In a browser, go to <https://aka.ms/olksideload> — Outlook on the web opens
     and the add-ins dialog appears.
   - Select **My add-ins** -> **Custom Add-ins** -> **Add a custom add-in** ->
     **Add from File**.
   - Choose your `manifest.xml` and accept the prompts.
   - If "Add a custom add-in" is missing or disabled, your tenant blocks user
     sideloading; a one-time admin deploy via **Integrated Apps** in the M365
     admin center is the fallback.

5. **Enter the token.** Open any email, click **Send to WorkDesk**, expand
   **Settings**, paste the same value as `NSML_INGEST_SECRET`, and save. It is
   stored per-mailbox in roaming settings, not in the add-in's public code.

## Daily use

Open an email, click **Send to WorkDesk**, pick a workspace (and optionally a
case ID), then **Capture email**. It lands in WorkDesk exactly like an uploaded
EML.

## Known limits

- **Mobile**: add-in support in Outlook mobile is limited, so this is a
  desktop/web capture in practice.
- **Attachments**: file attachments are included up to a ~3 MB combined budget
  (serverless request bodies cap near 4.5 MB). Anything larger is recorded as
  metadata only and reported back in the result line.
- **Capture is manual per message** by design. Automatic folder capture would
  require a Graph `Mail.Read` consent, which needs admin on a locked tenant.

## Hardening backlog

- Add an HMAC over the request body in addition to the bearer token.
- Add per-source rate limiting at the ingest route.
- Optionally fetch full MIME via the item callback token for byte-exact
  fidelity, including larger attachments routed to private storage.
