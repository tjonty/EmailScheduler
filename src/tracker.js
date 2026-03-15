const fs = require("fs/promises");
const path = require("path");

const sentLogPath = path.resolve(__dirname, "..", "sent-log.json");

async function getSentIndexes() {
  try {
    const fileContents = await fs.readFile(sentLogPath, "utf8");
    const parsedEmails = JSON.parse(fileContents);

    if (!Array.isArray(parsedEmails)) {
      return new Set();
    }

    return new Set(
      parsedEmails
        .filter((email) => typeof email === "string")
        .map((email) => email.trim())
        .filter((email) => email.length > 0)
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      return new Set();
    }

    throw error;
  }
}

async function markAllAsSent(emailArray) {
  const sentEmails = await getSentIndexes();

  for (const email of emailArray) {
    if (typeof email !== "string") {
      continue;
    }

    const normalizedEmail = email.trim();

    if (normalizedEmail) {
      sentEmails.add(normalizedEmail);
    }
  }

  const serializedEmails = JSON.stringify([...sentEmails].sort(), null, 2);
  await fs.writeFile(sentLogPath, `${serializedEmails}\n`, "utf8");
}

module.exports = {
  getSentIndexes,
  markAllAsSent,
};
