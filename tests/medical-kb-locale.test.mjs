import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

import {
  MedicalKnowledgeBase,
  loadMedicalKnowledgeLocale,
  parseMedicalKnowledgeLocale,
} from "../dist/resources/medical-kb.js";
import { dispatchKnowledgeTool } from "../dist/tools/knowledge.js";

const localeUrl = new URL("../locales/en/medical-kb.json", import.meta.url);
const english = JSON.parse(readFileSync(localeUrl, "utf8"));
const spanishLocaleUrl = new URL("../locales/es/medical-kb.json", import.meta.url);
const spanish = JSON.parse(readFileSync(spanishLocaleUrl, "utf8"));

const KNOWLEDGE_RESOURCE_URIS = [
  "molecare://knowledge/abcde-criteria",
  "molecare://knowledge/skin-types",
  "molecare://knowledge/prevention-tips",
  "molecare://knowledge/when-to-see-doctor",
];

test("English medical knowledge locale is complete and is the runtime default", () => {
  const loaded = loadMedicalKnowledgeLocale();
  assert.deepEqual(loaded, english);

  const knowledgeBase = new MedicalKnowledgeBase();
  assert.deepEqual(knowledgeBase.listResources(), KNOWLEDGE_RESOURCE_URIS);
  for (const key of Object.keys(english.disclaimers)) {
    assert.equal(knowledgeBase.getDisclaimer(key), english.disclaimers[key]);
  }
  assert.match(english.disclaimers.educationalOnly, /educational purposes only/i);
  assert.match(english.disclaimers.educationalOnly, /does not constitute medical advice/i);

  const metadata = knowledgeBase.listResourceMetadata();
  assert.deepEqual(
    metadata.map((resource) => resource.uri),
    KNOWLEDGE_RESOURCE_URIS,
  );

  for (const item of metadata) {
    const localized = english.resources[item.uri];
    assert.equal(item.name, localized.name);
    assert.equal(item.description, localized.description);
    assert.equal(item.mimeType, "application/json");

    const resource = knowledgeBase.getResource(item.uri);
    assert.deepEqual(Object.keys(resource).sort(), ["content", "disclaimer", "title"]);
    assert.equal(resource.title, localized.title);
    assert.deepEqual(resource.content, localized.content);
    assert.equal(resource.disclaimer, english.disclaimers[localized.disclaimerKey]);
  }

  const [asymmetry] = knowledgeBase.search("asymmetry");
  assert.equal(asymmetry.term, english.knowledgeBase.asymmetry.term);
  assert.equal("keywords" in asymmetry, false, "search-only keywords leaked into the response");
});

test("Spanish medical knowledge locale loads explicitly", () => {
  assert.deepEqual(loadMedicalKnowledgeLocale("es"), spanish);
});

test("Spanish search accepts accented, unaccented, and compact terms", () => {
  const knowledgeBase = new MedicalKnowledgeBase(loadMedicalKnowledgeLocale("es"));
  const exactMatches = [
    ["asimetría", "asimetria", spanish.knowledgeBase.asymmetry.term],
    ["diámetro", "diametro", spanish.knowledgeBase.diameter.term],
    ["6 mm", "6mm", spanish.knowledgeBase.diameter.term],
    ["evolución", "evolucion", spanish.knowledgeBase.evolution.term],
    ["cáncer de piel", "cancer de piel", spanish.knowledgeBase.melanoma.term],
  ];

  for (const [accented, unaccented, expectedTerm] of exactMatches) {
    for (const query of [accented, unaccented]) {
      const [result] = knowledgeBase.search(query);
      assert.ok(result, `${query} returned no result`);
      assert.equal(result.term, expectedTerm, query);
      assert.equal("keywords" in result, false, "search-only keywords leaked into the response");
    }
  }

  for (const query of ["protección solar", "proteccion solar"]) {
    const terms = knowledgeBase.search(query).map((result) => result.term);
    assert.ok(terms.includes(spanish.knowledgeBase.sunscreen.term), query);
    assert.ok(terms.includes(spanish.knowledgeBase["uv-protection"].term), query);
  }
});

test("Spanish resources expose localized metadata and payloads", () => {
  const knowledgeBase = new MedicalKnowledgeBase(spanish);
  const metadata = knowledgeBase.listResourceMetadata();

  assert.deepEqual(
    metadata.map((resource) => resource.uri),
    KNOWLEDGE_RESOURCE_URIS,
  );

  for (const item of metadata) {
    const localized = spanish.resources[item.uri];
    assert.equal(item.name, localized.name);
    assert.equal(item.description, localized.description);
    assert.equal(item.mimeType, "application/json");

    const resource = knowledgeBase.getResource(item.uri);
    assert.equal(resource.title, localized.title);
    assert.deepEqual(resource.content, localized.content);
    assert.equal(resource.disclaimer, spanish.disclaimers[localized.disclaimerKey]);
  }

  assert.equal(metadata[0].name, "Criterios ABCDE del melanoma");
  assert.equal(
    knowledgeBase.getResource("molecare://knowledge/abcde-criteria").content.criteria[0]
      .name,
    "Asimetría",
  );
});

test("Spanish disclaimers retain non-diagnostic meaning and reach tool output", async () => {
  for (const disclaimer of Object.values(spanish.disclaimers)) {
    assert.match(disclaimer, /(?:únicamente|solo) con fines educativos/i);
    assert.match(disclaimer, /no constituye (?:asesoramiento|consejo) médico/i);
  }
  assert.match(
    spanish.disclaimers.educationalOnlyWithConsult,
    /consulte siempre a un profesional de la salud/i,
  );
  assert.match(
    spanish.disclaimers.educationalOnlyPleaseConsult,
    /consulte a un profesional de la salud/i,
  );

  const result = await dispatchKnowledgeTool(
    {},
    new MedicalKnowledgeBase(spanish),
    "search_medical_info",
    { query: "diámetro" },
  );
  const payload = JSON.parse(result.content[0].text);
  assert.equal(payload.results[0].term, "Diámetro");
  assert.equal(payload.disclaimer, spanish.disclaimers.educationalOnlyPleaseConsult);
});

test("every shipped medical knowledge locale has the complete English shape", () => {
  const localesUrl = new URL("../locales/", import.meta.url);
  const localeNames = readdirSync(localesUrl, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert.ok(localeNames.includes("en"), "the required English locale is missing");
  for (const locale of localeNames) {
    assert.doesNotThrow(
      () => loadMedicalKnowledgeLocale(locale),
      `${locale} is not a loadable, complete medical knowledge locale`,
    );
  }
});

test("search_medical_info uses the canonical locale disclaimer", async () => {
  const result = await dispatchKnowledgeTool(
    {},
    new MedicalKnowledgeBase(),
    "search_medical_info",
    { query: "ABCDE" },
  );
  const payload = JSON.parse(result.content[0].text);
  assert.equal(payload.disclaimer, english.disclaimers.educationalOnlyPleaseConsult);
});

test("locale validation rejects every kind of missing required key", () => {
  const cases = [
    {
      name: "knowledge entry",
      expectedPath: /knowledgeBase\.asymmetry/,
      remove(locale) {
        delete locale.knowledgeBase.asymmetry;
      },
    },
    {
      name: "knowledge entry field",
      expectedPath: /knowledgeBase\.border\.definition/,
      remove(locale) {
        delete locale.knowledgeBase.border.definition;
      },
    },
    {
      name: "canonical disclaimer",
      expectedPath: /disclaimers\.educationalOnly/,
      remove(locale) {
        delete locale.disclaimers.educationalOnly;
      },
    },
    {
      name: "resource",
      expectedPath: /resources\.molecare:\/\/knowledge\/skin-types/,
      remove(locale) {
        delete locale.resources["molecare://knowledge/skin-types"];
      },
    },
    {
      name: "resource listing metadata",
      expectedPath: /resources\.molecare:\/\/knowledge\/prevention-tips\.description/,
      remove(locale) {
        delete locale.resources["molecare://knowledge/prevention-tips"].description;
      },
    },
    {
      name: "nested resource copy",
      expectedPath: /criteria\.0\.what_to_look_for/,
      remove(locale) {
        delete locale.resources["molecare://knowledge/abcde-criteria"].content.criteria[0]
          .what_to_look_for;
      },
    },
    {
      name: "resource disclaimer reference",
      expectedPath: /resources\.molecare:\/\/knowledge\/when-to-see-doctor\.disclaimerKey/,
      remove(locale) {
        delete locale.resources["molecare://knowledge/when-to-see-doctor"].disclaimerKey;
      },
    },
  ];

  for (const fixture of cases) {
    const incomplete = structuredClone(english);
    fixture.remove(incomplete);
    assert.throws(
      () => parseMedicalKnowledgeLocale(incomplete, "en"),
      fixture.expectedPath,
      `${fixture.name} was not required`,
    );
  }
});

test("locale loader rejects path-like locale identifiers", () => {
  assert.throws(
    () => loadMedicalKnowledgeLocale("../en"),
    /Invalid medical knowledge locale identifier/,
  );
});

test("locale validation rejects whitespace-only medical copy", () => {
  const blankDisclaimer = structuredClone(english);
  blankDisclaimer.disclaimers.educationalOnlyPleaseConsult = " \n\t";
  assert.throws(
    () => parseMedicalKnowledgeLocale(blankDisclaimer, "en"),
    /disclaimers\.educationalOnlyPleaseConsult: Text must contain a non-whitespace character/,
  );
});

test("locale assets are included in npm packages and production images", () => {
  const packageJson = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.ok(packageJson.files.includes("locales"), "npm package omits locale assets");

  const dockerfile = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
  assert.match(dockerfile, /COPY locales\/ \.\/locales\//);
  assert.match(dockerfile, /COPY --from=builder \/app\/locales \.\/locales/);
});
