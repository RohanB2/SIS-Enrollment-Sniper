# Google Cloud restart checklist

The live setup has two Google Cloud projects: `sis-spotbot` contains an older Cloud Run service and paused Scheduler job, while `sis-course-sniper-bot` contains the Firestore database. The Python script is packaged by `Dockerfile` as a new Cloud Run **Job** in `sis-spotbot`, because Cloud Run currently requires billing in the Firestore project. Cloud Scheduler invokes that job. It is not an HTTP server.

## Before the cutover

1. In Vercel, set server-only environment variables `MASTER_PASSWORD`, `SESSION_SECRET` (at least 32 random characters), and `FIREBASE_SERVICE_ACCOUNT_JSON`. The JSON must belong to a service account with Firestore read/write access in `sis-course-sniper-bot`. Do not use a public `NEXT_PUBLIC_` variable for this credential. Deploy the updated web app and verify login, loading the existing tracker, adding/removing a test section, and the pause toggle.
2. Build the root `Dockerfile` into an image in Google Artifact Registry and deploy it as a Cloud Run Job in `sis-spotbot`. Grant its runtime service account Firestore read/write access on `sis-course-sniper-bot`. Cloud Run supplies Application Default Credentials; no JSON key is needed in the job.
3. If using email alerts, store `sender_email` and `app_password` as job secrets or protected environment variables. Discord destinations remain in the Firestore tracker document. The runner reads the current term and course list from `data/tracker`; `track.txt` is not used.
4. Run the job once manually. Inspect its logs for Firestore and SIS errors. A currently open tracked section may send an alert on this run. Pause the bot in the dashboard first if you want a no-alert deployment check, then resume it for a real check.
5. Deploy `firebase/firestore.rules`, which denies all browser/client SDK reads and writes. Server SDKs continue through IAM. Verify the dashboard and another manual job run after the rules deployment.
6. In the Cloud Run Job's **Triggers** tab, add a Cloud Scheduler trigger with frequency `*/5 * * * *` and timezone America/New_York. Use a Scheduler service account with Cloud Run Invoker permission on this job. The Google Cloud console configures the authenticated invocation. The existing `sis-spotbot-timer` is paused and targets an older Cloud Run service; leave it paused.
7. Once a scheduled execution succeeds, remove the `schedule` trigger from `.github/workflows/sniper.yml` (or disable that workflow) so the two schedulers do not both run.

Do not deploy the new Python runner to the existing GitHub Action without Google service-account credentials there: it now uses Application Default Credentials. The existing Action remains untouched locally during the migration, but a push of this code before the Cloud Run cutover will make that scheduled runner fail.

## Behavior

The runner stores alert state in the `alert_state` collection. It sends one alert when a section is first seen open, and resets the state when it is seen closed. If delivery fails, the next check retries. A change of notification destination creates a new alert identity. The state is written after delivery, so simultaneous executions could still send duplicates; avoid overlapping job executions.

The dashboard session lasts seven days. Changing `SESSION_SECRET` signs everyone out. The app no longer has a fallback master password.

## Remaining access needed

To complete the live setup, the project owner needs to provide access to the Google Cloud and Vercel projects or perform the console steps above. The repository alone does not expose the live IAM, Artifact Registry, Cloud Run, Scheduler, Vercel secret, or Firestore rule state.
