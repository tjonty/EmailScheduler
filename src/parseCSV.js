const fs = require("fs/promises");
const { parse } = require("csv-parse/sync");

async function loadContacts(filePath) {
  const csvContent = await fs.readFile(filePath, "utf8");

  return parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

module.exports = {
  loadContacts,
};
