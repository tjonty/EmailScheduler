const fs = require("fs/promises");
const path = require("path");

const sentLogPath = path.resolve(__dirname, "..", "sent-log.json");

async function getSentIndexes() {
  try {
    const fileContents = await fs.readFile(sentLogPath, "utf8");
    const parsedIndexes = JSON.parse(fileContents);

    if (!Array.isArray(parsedIndexes)) {
      return new Set();
    }

    return new Set(
      parsedIndexes
        .map((index) => Number(index))
        .filter((index) => Number.isInteger(index) && index >= 0)
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      return new Set();
    }

    throw error;
  }
}

async function getsentIndexes() {
  return getSentIndexes();
}

async function markAsSent(index) {
  const sentIndexes = await getSentIndexes();
  sentIndexes.add(index);

  const serializedIndexes = JSON.stringify([...sentIndexes].sort((a, b) => a - b), null, 2);
  await fs.writeFile(sentLogPath, `${serializedIndexes}\n`, "utf8");
}

module.exports = {
  getsentIndexes,
  getSentIndexes,
  markAsSent,
};
