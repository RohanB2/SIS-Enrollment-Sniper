# SIS Enrollment Sniper

A full-stack application that monitors UVA course enrollment through the official SIS API. It features a modern web dashboard to manage your tracked classes and uses GitHub Actions to run automated checks, sending real-time Discord or email notifications when spots open up.

## Architecture & How It Works

1. **The Web Dashboard (Next.js)**: A secure UI to easily add or remove classes you want to track, toggle the bot's active status, and configure the active academic term.
2. **The Database (Firebase Firestore)**: Stores your tracked classes, notification targets (Discord webhooks or Emails), and bot status in the cloud.
3. **The Sniper Bot (Python)**: An automated script that reads from the database, queries the official UVA SIS API for current enrollment data, and sends alerts.
4. **The Automation (GitHub Actions)**: Runs the Sniper Bot automatically on a continuous schedule in the background, entirely for free.

## Setup & Deployment

### 1. Prerequisites
- A UVA NetID
- A GitHub Account
- A Vercel Account
- A Google/Firebase Account

### 2. Configure Firebase (Database)
1. Create a new Firebase project and initialize a Firestore Database.
2. Set the Firestore Security Rules.
3. In your Firebase Project Settings, copy your Web API Key.

### 3. Deploy the Dashboard (Vercel)
1. Fork or clone this repository to your GitHub.
2. Import the project into Vercel, specifically pointing to the `web` folder.
3. Add the following Environment Variables in Vercel:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: Your Firebase Web API Key
   - `MASTER_PASSWORD`: A password you choose to log into the dashboard securely.
4. Click Deploy.

### 4. Configure Automated Bot (GitHub Actions)
1. Go to your GitHub repository settings.
2. Navigate to **Secrets and variables > Actions**.
3. Add the following repository secrets so the script can access the database and send emails:
   - `FIREBASE_API_KEY`: Your Firebase Web API Key.
   - `SENDER_EMAIL`: The Gmail address the bot will use to send emails.
   - `APP_PASSWORD`: A 16-character Google App Password for the sender email (found in your Google Account Security settings).
4. The bot will now automatically run based on the schedule configured in `.github/workflows/sniper.yml` (default is every 30 minutes).

## Usage

1. Navigate to your deployed Vercel website.
2. Log in using your configured `MASTER_PASSWORD`.
3. Set the active academic term using the "Change" button at the top.
4. Add classes you want to track by entering their 5-digit section number.
5. For each class, specify whether you want a Discord Webhook alert or an Email alert, and provide the target destination.
6. Use the global toggle in the top right to easily pause or activate the bot without modifying code.
7. The GitHub Action will handle the rest in the background!

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
Create a `keys.env` file in the root directory with your credentials, then run:
```bash
pip install -r requirements.txt
python3 ProjectSIS.py
```

## Disclaimer
This tool accesses public enrollment data through UVA's official API. Ensure your use complies with university policies. The authors are not responsible for any account issues or enrollment-related problems.
