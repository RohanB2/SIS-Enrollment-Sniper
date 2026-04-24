# SIS Enrollment Sniper 🎯

A Python script that monitors UVA course enrollment through the actual SIS API and sends real-time Discord or email notifications when spots open up in your tracked classes.

## How It Works

The script reads a list of classes from `track.txt`, queries the official UVA SIS API for current enrollment data, and instantly alerts you via Discord or email when an open spot is detected.

### Key Features

✅ **Official UVA SIS API** – Uses the real enrollment data from UVA's registration system
📧 **Dual Notifications** – Send alerts via Discord webhooks or email (or both)
📝 **Simple Config File** – Just add class numbers to `track.txt` with the term
⚡ **Fast & Efficient** – Single script run checks all your tracked classes instantly
📊 **Detailed Course Info** – Notifications include professor, time, capacity, and course description
🔑 **Secure Credentials** – Uses environment variables from `keys.env` (never hardcoded)

## Installation

### Prerequisites

- Python 3.7+
- A UVA NetID (to access SIS)
- For Discord alerts: A Discord server with webhook access
- For email alerts: A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833)

### Setup

```bash
# Clone the repository
git clone https://github.com/RohanB2/SIS-Enrollment-Sniper.git
cd SIS-Enrollment-Sniper

# Install required packages
pip install requests python-dotenv

# Create virtual environment (optional but recommended)
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

## Configuration

### 1. Create `keys.env` File

Create a file named `keys.env` in the project root with your credentials:

```env
# Discord Webhook (optional)
discord_webhook_url=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL

# Email Credentials (optional)
sender_email=your-email@gmail.com
app_password=your-16-character-app-password
recipient_email=where-alerts-go@gmail.com
```

**Important:** Add `keys.env` to `.gitignore` (already done) so you never accidentally commit your credentials!

#### Getting Discord Webhook URL

1. In Discord, right-click your server → **Server Settings**
2. Go to **Integrations** → **Webhooks**
3. Click **Create Webhook**
4. Name it "SIS Sniper" and choose a channel
5. Copy the **Webhook URL**

#### Gmail App Password

Gmail doesn't allow regular passwords for third-party apps. Get an app password:

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select **Mail** and **Windows Computer** (or your device)
3. Google generates a 16-character password
4. Copy it to your `keys.env` file

### 2. Configure `track.txt`

Add classes you want to monitor:

```
1268
16032 # Hui Ma Probability 12-12:50 MWF
16033 # Probability
17011 # Alternative Probability Section
16406 # ODE with Shiran Povat
```

**Format:**
- **Line 1:** Term code (required)
- **Lines 2+:** 5-digit section numbers with optional comments

### Term Code Formula

```
1 + [2 digit year] + [2 for spring, 8 for fall]
```

**Examples:**
- `1228` = Spring 2022
- `1268` = Fall 2026
- `1232` = Spring 2023
- `1298` = Fall 2029

## Usage

### Run Once

```bash
python3 ProjectSIS.py
```

The script will:
1. Read all classes from `track.txt`
2. Query the UVA SIS API for each class
3. Calculate open spots (capacity - enrolled)
4. Send Discord/email notifications for any classes with open spots

### Run Continuously (Recommended)

Set up a scheduled task to run the script every few minutes:

#### macOS/Linux (Cron)

```bash
# Edit crontab
crontab -e

# Add this line to check every 5 minutes
*/5 * * * * cd /path/to/SIS-Enrollment-Sniper && python3 ProjectSIS.py
```

#### Windows (Task Scheduler)

1. Open **Task Scheduler**
2. Create a new task
3. Set trigger: **Repeat every 5 minutes**
4. Set action: **Run program** → `python3` with argument `C:\path\to\ProjectSIS.py`

## Example Output

```bash
$ python3 ProjectSIS.py

Checked CS4102. No spots open yet.
Checked MATH3310. No spots open yet.
CS3100 with Shiran Povat has 2 open spot(s)! Enroll now!
Discord alert sent successfully!
Checked CS2100. No spots open yet.
```

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

## API Details

### UVA SIS API Endpoint

```
https://sisuva.admin.virginia.edu/psc/ihprd/UVSS/SA/s/WEBLIB_HCX_CM.H_CLASS_SEARCH.FieldFormula.IScript_ClassSearch
```

**Query Parameters:**
- `institution=UVA01` – University identifier
- `term=XXXX` – Term code (e.g., 1268 for Fall 2026)
- `class_nbr=XXXXX` – 5-digit section number

### API Response Fields Used

| Field | Usage |
|-------|-------|
| `class_capacity` | Total available seats |
| `enrollment_total` | Currently enrolled students |
| `subject` + `catalog_nbr` | Course code (e.g., CS 3100) |
| `descr` | Full course title |
| `meetings[0]` | Time and days info |
| `instructors[0].name` | Professor name |

## Project Structure

```
SIS-Enrollment-Sniper/
├── ProjectSIS.py          # Main script
├── track.txt              # Classes to monitor
├── keys.env               # Credentials (in .gitignore)
├── .gitignore             # Git ignore file
└── README.md              # This file
```

## Function Reference

| Function | Purpose |
|----------|---------|
| `ask_user()` | Gets term and section number from user input |
| `get_classes_from_files()` | Reads classes from `track.txt` |
| `get_class_info(term, section_nbr)` | Queries SIS API and triggers notifications |
| `format_time(raw_time_str)` | Converts time format from API response |
| `send_discord_noti()` | Sends Discord webhook notification |
| `send_email_noti()` | Sends Gmail notification |

## Troubleshooting

### "Class not found. Check your term and section number."
- Verify the section number is 5 digits (found on Lou's List)
- Confirm the term code is correct (use the formula above)
- Check if the class exists in the current term

### "Failed to send Discord alert"
- Verify your webhook URL is correct
- Check that the webhook URL hasn't expired
- Ensure your Discord server/channel is accessible

### "Failed to send email"
- Confirm you're using a Gmail **App Password**, not your regular password
- Verify `sender_email` and `app_password` are correct in `keys.env`
- Check that 2-factor authentication is enabled on your Google account

### "ModuleNotFoundError: No module named 'requests'"
```bash
pip install requests python-dotenv
```

### Script runs but doesn't find your class
1. Double-check the 5-digit section number on Lou's List
2. Verify the term in `track.txt` matches the current term
3. Test by temporarily running a known open class

## Tips & Tricks

### Multiple Tracking Profiles

Create separate `track.txt` files and run them selectively:

```bash
cp track.txt track_spring.txt
python3 ProjectSIS.py  # Uses default track.txt
```

### Disable Notifications Temporarily

Comment out the notification function calls in `get_class_info()`:

```python
# send_discord_noti(course_name, desc, professor, open_spots, time)
# send_email_noti(course_name, desc, professor, open_spots, time)
```

### Test Notifications

Temporarily modify a class number to one you know has open spots to verify alerts work.

## Security Notes

🔒 **Never commit `keys.env`** – It's already in `.gitignore`, but always double-check
🔒 **Use App Passwords for Gmail** – Never use your actual Gmail password
🔒 **Regenerate Discord webhooks** if they leak
🔒 **Delete old webhooks** you're no longer using

## Rate Limiting

The UVA SIS API can handle frequent requests, but be respectful:
- Default setup: ~12 requests per minute (5-minute intervals)
- Avoid checking more often than every 2-3 minutes
- If you get rate-limited, increase the interval

## Contributing

Found a bug or have an improvement? 

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## License

Educational use. Please follow UVA's policies on automated access to university systems.

## Disclaimer

⚠️ This tool accesses public enrollment data through UVA's official API. Ensure your use complies with university policies. The authors are not responsible for any account issues or enrollment-related problems.

## Contact

Questions? Issues? Open a GitHub issue or reach out!

---

**Made by students, for students** ⚡

*Get those open spots faster than refresh warriors* 🏃‍♂️💨
