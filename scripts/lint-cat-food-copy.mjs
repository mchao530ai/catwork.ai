#!/usr/bin/env node
/**
 * Content lint: cat food weekday qualifier check
 *
 * Verifies that every mention of cat food being "included" or "provided"
 * in EN/JA/ZH locale files and faqs.ts also carries the weekday qualifier.
 *
 * Cat food is only available on weekdays. Any copy that says it is "included"
 * or "provided" without the weekday qualifier misleads weekend visitors.
 *
 * Exit 0 = all clear. Exit 1 = at least one violation found.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const FILES = [
  {
    path: "artifacts/catwork-cafe/src/i18n/locales/en.ts",
    lang: "en",
  },
  {
    path: "artifacts/catwork-cafe/src/i18n/locales/ja.ts",
    lang: "ja",
  },
  {
    path: "artifacts/catwork-cafe/src/i18n/locales/zh.ts",
    lang: "zh",
  },
  {
    path: "artifacts/catwork-cafe/src/data/faqs.ts",
    lang: "en",
  },
];

const RULES = {
  en: {
    trigger:
      /\bcat food\b.{0,80}(includ|provid)|(includ|provid).{0,80}\bcat food\b/i,
    qualifier: /\bweekday/i,
    qualifierLabel: '"weekday"',
    description:
      'EN: "cat food" + "included"/"provided" must also contain "weekday"',
  },
  ja: {
    trigger:
      /(エサ|キャットフード).{0,40}(含まれ|渡し|用意|含む)|(含まれ|渡し|用意|含む).{0,40}(エサ|キャットフード)/,
    qualifier: /平日/,
    qualifierLabel: '"平日"',
    description: "JA: cat food inclusion/provision must also contain 平日",
  },
  zh: {
    trigger:
      /(貓糧|飼料|貓食).{0,30}(附贈|包含|提供|含)|(附贈|包含|提供|含).{0,30}(貓糧|飼料|貓食)/,
    qualifier: /平日/,
    qualifierLabel: '"平日"',
    description: "ZH: cat food inclusion/provision must also contain 平日",
  },
};

let violations = 0;

for (const { path: relPath, lang } of FILES) {
  const absPath = join(root, relPath);
  let content;
  try {
    content = readFileSync(absPath, "utf8");
  } catch (err) {
    console.error(`✖ Could not read ${relPath}: ${err.message}`);
    violations++;
    continue;
  }

  const lines = content.split("\n");
  const rule = RULES[lang];

  lines.forEach((line, idx) => {
    if (rule.trigger.test(line) && !rule.qualifier.test(line)) {
      console.error(
        `\n❌  ${relPath}:${idx + 1}\n` +
          `    ${line.trim()}\n` +
          `    ↳ ${rule.description}\n` +
          `      Add ${rule.qualifierLabel} or rephrase to make the weekday restriction explicit.`
      );
      violations++;
    }
  });
}

if (violations > 0) {
  console.error(
    `\n✖ Cat food copy lint FAILED — ${violations} violation(s) found.\n` +
      "  Weekend visitors must never see cat food promised without the weekday qualifier."
  );
  process.exit(1);
} else {
  console.log(
    "✔ Cat food copy lint passed — all cat food inclusion/provision mentions carry the weekday qualifier."
  );
  process.exit(0);
}
