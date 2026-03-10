#!/usr/bin/env node
/**
 * Erzeugt eine JSON-Datei im Xray-Import-Format für Testergebnisse.
 * Sie führen die Tests manuell durch, tragen in results-rolenkonzept.json
 * pro Test-ID PASSED/FAILED ein und rufen dann dieses Skript auf.
 * Die ausgegebene JSON können Sie in Xray unter "Import Execution Results" importieren
 * oder per Xray REST API einspielen.
 *
 * Voraussetzung:
 * - sync-tests-to-xray.mjs wurde ausgeführt, sodass Tests in Jira existieren.
 * - Sie haben eine Test Execution in Jira angelegt (z.B. FR-100) und tragen
 *   den Key unten ein (oder über Umgebungsvariable).
 *
 * 1. Kopieren: cp execution-results-template.json results-rolenkonzept.json
 * 2. In results-rolenkonzept.json testExecutionKey auf Ihre Test-Execution setzen (z.B. FR-100).
 * 3. Pro Test status auf PASSED oder FAILED setzen (nach manueller Durchführung).
 * 4. Optional: node submit-execution-results.mjs
 *    → prüft/zeigt die JSON; Import in Xray manuell über UI oder API.
 *
 * Umgebung:
 *   JIRA_PROJECT_KEY     z.B. FR (für info.projectKey falls neue Test Execution)
 *   TEST_EXECUTION_KEY   z.B. FR-100 (bereits angelegte Test Execution)
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TEST_EXECUTION_KEY = process.env.TEST_EXECUTION_KEY;
const resultsPath = join(__dirname, "results-rolenkonzept.json");
const templatePath = join(__dirname, "execution-results-template.json");

function loadTestCases() {
  const path = join(__dirname, "test-cases-rolenkonzept.json");
  return JSON.parse(readFileSync(path, "utf-8"));
}

/**
 * Erzeugt eine Vorlage für Testergebnisse (IDs + status).
 * Nach sync-tests-to-xray.mjs: testExecutionKey und Jira-Keys aus created-tests-mapping.json eintragen.
 */
function generateTemplate() {
  const data = loadTestCases();
  const key = TEST_EXECUTION_KEY || "FR-XXX";
  const results = Object.fromEntries(data.tests.map((t) => [t.id, "TODO"]));
  const template = {
    testExecutionKey: key,
    comment: "Manuelle Ausführung Rollenkonzept – bitte pro ID PASSED oder FAILED eintragen.",
    results,
  };
  const outPath = join(__dirname, "execution-results-template.json");
  writeFileSync(outPath, JSON.stringify(template, null, 2), "utf-8");
  console.log(`Vorlage geschrieben: ${outPath}`);
  console.log("1. Kopieren nach results-rolenkonzept.json");
  console.log("2. testExecutionKey auf Ihre Test-Execution setzen (z.B. FR-100)");
  console.log("3. Pro Test-ID in 'results' PASSED oder FAILED eintragen.");
}

/**
 * Liest results-rolenkonzept.json und created-tests-mapping.json,
 * erzeugt die Xray-Import-JSON (mit Jira testKey) und gibt sie aus.
 */
function validateAndOutput() {
  if (!existsSync(resultsPath)) {
    console.error(`Datei fehlt: ${resultsPath}`);
    console.error("Kopieren Sie execution-results-template.json nach results-rolenkonzept.json.");
    process.exit(1);
  }
  const mappingPath = join(__dirname, "created-tests-mapping.json");
  if (!existsSync(mappingPath)) {
    console.error(`Zuordnung fehlt: ${mappingPath}`);
    console.error("Führen Sie zuerst sync-tests-to-xray.mjs aus (ohne --dry-run).");
    process.exit(1);
  }
  const content = JSON.parse(readFileSync(resultsPath, "utf-8"));
  const mapping = JSON.parse(readFileSync(mappingPath, "utf-8"));
  if (!content.testExecutionKey || content.testExecutionKey === "FR-XXX") {
    console.error("Bitte in results-rolenkonzept.json testExecutionKey setzen (z.B. FR-100).");
    process.exit(1);
  }
  const results = content.results || {};
  const tests = [];
  for (const [id, status] of Object.entries(results)) {
    const jiraKey = mapping[id];
    if (!jiraKey) continue;
    const s = (status || "").toUpperCase();
    tests.push({
      testKey: jiraKey,
      status: s === "PASSED" || s === "PASS" ? "PASSED" : s === "FAILED" || s === "FAIL" ? "FAILED" : "TODO",
      comment: content.comment || "",
    });
  }
  const todo = tests.filter((t) => t.status === "TODO").length;
  if (todo > 0) console.warn(`Noch ${todo} Tests mit status TODO.`);
  const output = {
    testExecutionKey: content.testExecutionKey,
    info: content.info || {},
    tests,
  };
  console.log(JSON.stringify(output, null, 2));
  console.error("\n→ Diese JSON in Xray unter 'Import Execution Results' hochladen (oder per API senden).");
}

const cmd = process.argv[2];
if (cmd === "template" || cmd === "--template") {
  generateTemplate();
} else {
  validateAndOutput();
}
