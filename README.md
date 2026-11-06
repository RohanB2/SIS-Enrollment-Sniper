# SIS Enrollment Sniper 🎯

*I built this project for my personal ease of use to guarantee I get into the classes I want without constantly refreshing SIS. It is currently deployed as a full web application at [https://sis-sniper-site.vercel.app/](https://sis-sniper-site.vercel.app/) (note: access to the dashboard is protected by a master password).*

A full-stack application that monitors UVA course enrollment through the official SIS API. It features a web dashboard to manage tracked classes and sends Discord or email notifications when spots open up.

## Architecture & How It Works

1. **The Web Dashboard (Next.js)**: A secure UI to easily add or remove classes you want to track, toggle the bot's active status, and configure the active academic term.
2. **The Database (Firebase Firestore)**: Stores your tracked classes, notification targets (Discord webhooks or Emails), and bot status in the cloud.
3. **The Sniper Bot (Python)**: A Cloud Run Job reads Firestore, queries UVA SIS, and sends alerts.
4. **The Automation (Cloud Scheduler)**: Invokes the Cloud Run Job on a schedule. The GitHub Actions schedule remains in the repository only during migration.

## Setup & Deployment

### 1. Prerequisites
- A UVA NetID
- A GitHub Account
- A Vercel Account
- A Google/Firebase Account

### 2. Configure Firebase (Database)
1. Create a new Firebase project and initialize a Firestore Database.
2. Set the Firestore Security Rules.
3. Deploy the deny-all rules in `firebase/firestore.rules` after the dashboard and job have server credentials.

### 3. Deploy the Dashboard (Vercel)
1. Fork or clone this repository to your GitHub.
2. Import the project into Vercel, specifically pointing to the `web` folder.
3. Add the following Environment Variables in Vercel:
   - `MASTER_PASSWORD`: A strong password for the dashboard.
   - `SESSION_SECRET`: A random secret of at least 32 characters for signed login cookies.
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: The Firestore service account JSON, stored only as a server-side secret.
4. Click Deploy.

### 4. Configure the scheduled bot
See [CLOUD_SETUP.md](CLOUD_SETUP.md) for the migration sequence and required Google Cloud permissions and secrets.

## Usage

1. Navigate to your deployed Vercel website.
2. Log in using your configured `MASTER_PASSWORD`.
3. Set the active academic term using the "Change" button at the top.
4. Add classes you want to track by entering their 5-digit section number.
5. For each class, specify whether you want a Discord Webhook alert or an Email alert, and provide the target destination.
6. Use the global toggle in the top right to easily pause or activate the bot without modifying code.
7. The Cloud Scheduler job will handle future checks.

## Example Output

### Discord Notification Example

When a spot opens, you'll get a Discord embed like this:

```
🎯 SIS SPOT OPEN ALERT @everyone

Spots Open: Data Structures & Algorithms - CS 3100
Go to SIS immediately to enroll!

Course: CS 3100
Course Name: Data Structures & Algorithms
Professor: Shiran Povat
Time: MWF: 1:00 PM - 1:50 PM
Open Spots: 2

UVA SIS Course Sniper
```

### Email Notification Example

```
Subject: Open Spot: Data Structures & Algorithms - CS 3100

🚨 SPOT OPEN ALERT 🚨

Course: Data Structures & Algorithms - CS 3100
Professor: Shiran Povat
Time: MWF: 1:00 PM - 1:50 PM
Spots Available: 2

Go to SIS immediately to enroll!
```

## Term Code Formula
When setting the active term in the dashboard, calculate it using the following formula:
`1 + [2 digit year] + [2 for Spring, 8 for Fall]`

Examples:
- Spring 2023 = 1232
- Fall 2026 = 1268

## Local Development

**To run the web dashboard locally:**
```bash
cd web
npm install
npm run dev
```

**To run the python bot locally:**
Authenticate to Google Cloud with Application Default Credentials for `sis-course-sniper-bot`. If using email alerts, place `sender_email` and `app_password` in a local `keys.env` file. Running the bot can send real notifications.
```bash
pip install -r requirements.txt
python3 ProjectSIS.py
```

## Disclaimer
This tool accesses public enrollment data through UVA's official API. Ensure your use complies with university policies. The authors are not responsible for any account issues or enrollment-related problems.
