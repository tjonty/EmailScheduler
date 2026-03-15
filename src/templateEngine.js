function replacePlaceholders(templateText, rowObject) {
  if (typeof templateText !== "string") {
    return "";
  }

  const normalizedEntries = Object.entries(rowObject || {}).reduce((acc, [key, value]) => {
    acc[key.toLowerCase()] = value ?? "";
    return acc;
  }, {});

  return templateText.replace(/{{\s*([^}]+?)\s*}}/gi, (_, placeholderName) => {
    const normalizedKey = placeholderName.toLowerCase();

    if (!(normalizedKey in normalizedEntries)) {
      console.warn(`Warning: no value found for placeholder {{${placeholderName}}}`);
      return "";
    }

    return normalizedEntries[normalizedKey] ?? "";
  });
}

module.exports = {
  replacePlaceholders,
};
