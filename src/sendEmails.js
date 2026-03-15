const fs = require("fs/promises");
const path = require("path");

const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

const { loadContacts } = require("./parseCSV");
const { replacePlaceholders } = require("./templateEngine");
const { getSentIndexes, markAllAsSent } = require("./tracker");

dotenv.config();

const DAILY_LIMIT = 20;

function parseTemplateFile(templateText) {
  const normalizedTemplate = templateText.replace(/\r\n/g, "\n");
  const lines = normalizedTemplate.split("\n");
  const firstLine = lines[0] || "";
  const subjectMatch = firstLine.match(/^Subject:\s*(.*)$/i);

  if (!subjectMatch) {
    return {
      subjectTemplate: null,
      bodyTemplate: templateText,
    };
  }

  const remainingLines = lines.slice(1);
  const bodyTemplate =
    remainingLines[0] === "" ? remainingLines.slice(1).join("\n") : remainingLines.join("\n");

  return {
    subjectTemplate: subjectMatch[1].trim(),
    bodyTemplate,
  };
}

async function sendEmails() {
  const isTestMode = process.argv.includes("--test");
  const projectRoot = path.resolve(__dirname, "..");
  const contactsPath = path.join(
    projectRoot,
    "data",
    isTestMode ? "test-contacts.csv" : "contacts.csv"
  );
  const templatePath = path.join(projectRoot, "templates", "template1.txt");
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error("Missing one or more required environment variables.");
  }

  const contacts = await loadContacts(contactsPath);
  const templateText = await fs.readFile(templatePath, "utf8");
  const { subjectTemplate, bodyTemplate } = parseTemplateFile(templateText);
  const sentEmails = isTestMode ? new Set() : await getSentIndexes();

  if (!subjectTemplate) {
    throw new Error("Missing email subject. Add a 'Subject:' line to the template.");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  let sentCount = 0;
  const newlySentEmails = [];

  for (const [index, contact] of contacts.entries()) {
    const recipientEmail =
      typeof contact.email === "string" ? contact.email.trim() : "";

    if (!recipientEmail) {
      console.warn(`Skipping row ${index}: missing email.`);
      continue;
    }

    if (!isTestMode && sentEmails.has(recipientEmail)) {
      console.log(`Skipping row ${index}: already sent to ${recipientEmail}.`);
      continue;
    }

    if (sentCount >= DAILY_LIMIT) {
      console.log(`Daily limit reached (${DAILY_LIMIT} emails sent this run).`);
      break;
    }

    const subject = replacePlaceholders(subjectTemplate, contact);
    const body = replacePlaceholders(bodyTemplate, contact);

    try {
      await transporter.sendMail({
        from: GMAIL_USER,
        to: recipientEmail,
        subject,
        text: body,
      });

      console.log(`Sent email to ${recipientEmail} (row ${index}).`);

      if (!isTestMode) {
        newlySentEmails.push(recipientEmail);
        sentEmails.add(recipientEmail);
      }

      sentCount += 1;
    } catch (error) {
      console.error(`Failed to send email to ${recipientEmail} (row ${index}).`);
      console.error(error.message);
    }
  }

  if (!isTestMode && newlySentEmails.length > 0) {
    await markAllAsSent(newlySentEmails);
  }

  console.log(
    isTestMode
      ? `Test run complete. ${sentCount} email(s) sent.`
      : `Run complete. ${sentCount} email(s) sent and tracked.`
  );
}

sendEmails().catch((error) => {
  console.error("Email sender failed to start.");
  console.error(error.message);
  process.exitCode = 1;
});
