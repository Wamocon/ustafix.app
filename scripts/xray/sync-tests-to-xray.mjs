#!/usr/bin/env node
/**
 * Erstellt Testfälle (Rollenkonzept) in Jira/Xray per REST API.
 * Testergebnisse können anschließend manuell in Xray erfasst oder per
 * submit-execution-results.mjs (Xray JSON-Format) importiert werden.
 *
 * Umgebung:
 *   JIRA_BASE_URL   z.B. https://wamocon.atlassian.net
 *   JIRA_EMAIL      Ihre Jira-E-Mail
 *   JIRA_API_TOKEN  API-Token von https://id.atlassian.com/manage-profile/security/api-tokens
 *   JIRA_PROJECT_KEY z.B. FR
 *
 * Optional (Xray Custom Fields, pro Instanz unterschiedlich):
 *   JIRA_XRAY_TEST_TYPE_FIELD_ID  z.B. customfield_10200
 *   JIRA_XRAY_STEPS_FIELD_ID      z.B. customfield_10004 (Manual Test Steps, JSON)
 *
 * Aufruf: node scripts/xray/sync-tests-to-xray.mjs [--dry-run]
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes("--dry-run");

const JIRA_BASE_URL = process.env.JIRA_BASE_URL?.replace(/\/$/, "") || "https://wamocon.atlassian.net";
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || "FR";
const XRAY_TEST_TYPE_FIELD = process.env.JIRA_XRAY_TEST_TYPE_FIELD_ID;
const XRAY_STEPS_FIELD = process.env.JIRA_XRAY_STEPS_FIELD_ID;

function envCheck() {
  if (!JIRA_EMAIL || !JIRA_API_TOKEN) {
    console.error("Bitte JIRA_EMAIL und JIRA_API_TOKEN setzen (z.B. in .env oder Export).");
    console.error("API-Token: https://id.atlassian.com/manage-profile/security/api-tokens");
    process.exit(1);
  }
}

function loadTestCases() {
  const path = join(__dirname, "test-cases-rolenkonzept.json");
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw);
}

function buildDescription(tc) {
  return [
    `Teststufe: ${tc.testLevel}`,
    `Referenz: docs/TESTSTUFEN-Rollenkonzept.md (${tc.id})`,
    "",
    "Schritte:",
    tc.steps,
    "",
    "Erwartetes Ergebnis:",
    tc.expectedResult,
  ].join("\n");
}

function buildIssuePayload(tc) {
  const summary = `[Rollenkonzept] ${tc.id}: ${tc.summary}`;
  const description = buildDescription(tc);
  const labels = ["rolenkonzept", `test-level-${tc.testLevel}`];

  const fields = {
    project: { key: JIRA_PROJECT_KEY },
    summary,
    description,
    issuetype: { name: "Test" },
    labels,
  };

  if (XRAY_TEST_TYPE_FIELD) {
    fields[XRAY_TEST_TYPE_FIELD] = { value: "Manual" };
  }

  if (XRAY_STEPS_FIELD) {
    fields[XRAY_STEPS_FIELD] = {
      steps: [
        {
          index: 0,
          step: tc.steps,
          data: "",
          result: tc.expectedResult,
        },
      ],
    };
  }

  return { fields };
}

async function createIssue(payload) {
  const url = `${JIRA_BASE_URL}/rest/api/2/issue`;
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira API ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  envCheck();
  const data = loadTestCases();
  const created = [];

  console.log(`Projekt: ${JIRA_PROJECT_KEY}, Anzahl Tests: ${data.tests.length}`);
  if (DRY_RUN) console.log("(Dry-Run – es wird nichts erstellt)\n");

  for (const tc of data.tests) {
    const payload = buildIssuePayload(tc);
    const summary = payload.fields.summary;
    if (DRY_RUN) {
      console.log(`[DRY-RUN] Würde anlegen: ${summary}`);
      continue;
    }
    try {
      const result = await createIssue(payload);
      const key = result.key;
      created.push({ id: tc.id, key, summary: payload.fields.summary });
      console.log(`Angelegt: ${key} – ${tc.id}`);
    } catch (e) {
      console.error(`Fehler bei ${tc.id}:`, e.message);
    }
  }

  if (created.length > 0) {
    console.log("\n--- Erstellte Issues ---");
    created.forEach(({ id, key }) => console.log(`${id} → ${key}`));
    const mappingPath = join(__dirname, "created-tests-mapping.json");
    const mapping = Object.fromEntries(created.map((c) => [c.id, c.key]));
    writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), "utf-8");
    console.log(`\nZuordnung gespeichert: ${mappingPath} (wird für submit-execution-results.mjs benötigt).`);
    console.log("Diese Keys können Sie in Xray einem Test Plan zuweisen.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
