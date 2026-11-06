# Google Cloud bot setup

The live setup has two Google Cloud projects: `sis-spotbot` hosts the new Cloud Run Job and Scheduler timer, while `sis-course-sniper-bot` hosts Firestore. The Python script is packaged by `Dockerfile` as a Cloud Run **Job**. It is not an HTTP server.

## Live bot status

- `sis-sniper-tracker` runs in `northamerica-northeast2` with `sis-sniper-runner@sis-spotbot.iam.gserviceaccount.com`. That identity has Firestore read/write access in `sis-course-sniper-bot`.
- `sis-sniper-tracker-five-minute` is enabled in `northamerica-northeast1` with `*/5 * * * *` in `America/New_York`. It uses OAuth as `sis-sniper-scheduler@sis-spotbot.iam.gserviceaccount.com`, which has Cloud Run Invoker access on this job only.
- A manual Cloud Run execution, a forced Scheduler execution, and the first automatic five-minute execution all completed successfully. The runner checked the tracked STS 2600 section and found no open seats at the time of the manual run.
- The older `sis-spotbot-timer` remains paused. The GitHub Actions `schedule` trigger was removed from `main`; `workflow_dispatch` remains for manual use.
- The runner reads the current term and course list from Firestore `data/tracker`; `track.txt` is not used. Discord destinations remain in that document. Alert deduplication state is stored in `alert_state`.

## Dashboard work still to release

The Vercel site is still on the older `main` web code. Before releasing the dashboard changes on this branch, set server-only Vercel variables `MASTER_PASSWORD`, `SESSION_SECRET` (at least 32 random characters), and `FIREBASE_SERVICE_ACCOUNT_JSON`. The JSON must belong to a service account with Firestore read/write access in `sis-course-sniper-bot`. Do not use a public `NEXT_PUBLIC_` variable for this credential. Deploy the updated site and verify login, loading the tracker, adding/removing a test section, and the pause toggle.

Then deploy `firebase/firestore.rules`, which denies browser/client SDK reads and writes. Server SDKs continue through IAM. Verify the dashboard and a bot run after the rules deployment. This rules change has not been deployed yet.

If using email alerts, store `sender_email` and `app_password` as job secrets or protected environment variables. The current configured notification type is Discord.

The Python runner uses Application Default Credentials and will not run in the GitHub Action without adding a Google identity there. Keep the Action for manual fallback only until the dashboard release is complete, or remove it when it is no longer useful.

## Behavior

The runner stores alert state in the `alert_state` collection. It sends one alert when a section is first seen open, and resets the state when it is seen closed. If delivery fails, the next check retries. A change of notification destination creates a new alert identity. The state is written after delivery, so simultaneous executions could still send duplicates; avoid overlapping job executions.

The dashboard session lasts seven days. Changing `SESSION_SECRET` signs everyone out. The app no longer has a fallback master password.
