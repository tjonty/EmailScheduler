# 📧 Email Scheduler

A lightweight Node.js tool that sends personalized emails from a CSV contact list through Gmail SMTP. Runs automatically on a weekday schedule using GitHub Actions - no server required, completely free.

---

## How It Works

1. You provide a CSV file of contacts and a plain-text email template
2. The script personalizes each email by replacing `{{placeholders}}` with contact data
3. It sends up to **20 emails per run** through your Gmail account
4. It tracks sent emails by address so no one gets emailed twice
5. GitHub Actions runs the script automatically every weekday morning and commits the updated sent log back to the repo

---

## Project Structure

```
email-scheduler/
├── .github/
│   └── workflows/
│       └── send-emails.yml       # GitHub Actions cron schedule
├── data/
│   ├── contacts.csv              # Real recipient list
│   └── test-contacts.csv         # Test list (use your own email here)
├── templates/
│   └── template1.txt             # Email subject + body template
├── src/
│   ├── sendEmails.js             # Main script / entry point
│   ├── parseCSV.js               # CSV file reader
│   ├── templateEngine.js         # Placeholder replacer
│   └── tracker.js                # Tracks sent emails in sent-log.json
├── sent-log.json                 # Auto-generated, do not edit manually
├── .env                          # Local secrets — never commit this
├── .env.example                  # Committed placeholder for env vars
├── .gitignore
└── package.json
```

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/email-scheduler.git
cd email-scheduler
npm install
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

Edit `.env`:

```
GMAIL_USER=youremail@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

> ⚠️ Never commit your `.env` file. It is already in `.gitignore`.

### 3. Get a Gmail App Password

- Go to [myaccount.google.com/security](https://myaccount.google.com/security)
- Enable **2-Step Verification** (required)
- Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
- Create a new App Password named `EmailScheduler`
- Copy the 16-character password and paste it into `.env` with **no spaces**

---

## CSV Format

Your `data/contacts.csv` must have a header row. Required column: `email`. All other columns are optional but must match the placeholders you use in your template.

```csv
firstname,lastname,companyname,email,jobtitle
John,Smith,Acme Corp,john@acme.com,CEO
Jane,Doe,Beta Inc,jane@beta.com,Founder
```

Your `data/test-contacts.csv` should have the same columns but use **your own email address** for safe testing.

---

## Template Format

Edit `templates/template1.txt`. The **first line must start with `Subject:`**. Everything after that is the email body.

```
Subject: Quick note for {{firstname}} at {{companyname}}

Hi {{firstname}},

I came across {{companyname}} and wanted to reach out...

Best,
Your Name
```

### Placeholder Rules

- Use `{{columnname}}` where `columnname` matches a CSV header
- Placeholders are **case-insensitive** - `{{FirstName}}` and `{{firstname}}` both work
- If a placeholder has no matching column, it will be replaced with an empty string and a warning will be logged

---

## Running Locally

### Test run (uses `data/test-contacts.csv`, skips sent-log tracking)

```bash
npm run test-send
```

Always do this first to verify your template and credentials are working before touching your real contact list.

### Real run (uses `data/contacts.csv`, tracks sent emails)

```bash
npm start
```

---

## GitHub Actions (Automatic Scheduling)

The script runs automatically **Monday–Friday at 9:00 AM CDT / 8:00 AM CST**.

### Setup

1. Push your repo to GitHub
2. Go to **Settings → Secrets and variables → Actions**
3. Add these secrets:

| Secret Name | Value |
|---|---|
| `GMAIL_USER` | your Gmail address |
| `GMAIL_APP_PASSWORD` | your 16-character app password (no spaces) |

4. Make sure `data/contacts.csv` and `templates/template1.txt` are committed to the repo
5. The workflow will run on schedule, send up to 20 emails, and commit the updated `sent-log.json` back to the repo automatically

### Manual trigger

Go to **Actions → Send Scheduled Emails → Run workflow** to trigger a run at any time.

---

## Sent Log

`sent-log.json` tracks which email addresses have already been sent to. It is automatically updated after each run and committed back to the repo by the GitHub Action.

```json
["john@acme.com", "jane@beta.com"]
```

> ⚠️ Do not manually edit this file. If you need to re-send to someone, remove their email address from the array.

---

## Daily Limit

The script sends a maximum of **20 emails per run**. This keeps you well within Gmail's free sending limits (500/day). The scheduler runs once per weekday, so the practical output is up to 100 emails per week.

---

## Environment Variables

| Variable | Description |
|---|---|
| `GMAIL_USER` | The Gmail address used to send emails |
| `GMAIL_APP_PASSWORD` | Gmail App Password (not your regular password) |

---

## Important Notes

- Emails are sent as **plain text** only
- Tracking is done by **email address** - safe to reorder your CSV without causing duplicate sends
- There is no retry logic - failed sends are logged and skipped
- The GitHub Action commits `sent-log.json` back to the repo after each run - this is intentional and expected

---
