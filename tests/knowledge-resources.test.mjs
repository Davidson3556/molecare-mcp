import assert from "node:assert/strict";
import { test } from "node:test";

import { MedicalKnowledgeBase } from "../dist/resources/medical-kb.js";

const NEW_RESOURCE_URIS = [
  "molecare://knowledge/sun-protection",
  "molecare://knowledge/common-benign-lesions",
  "molecare://knowledge/skin-self-examination",
  "molecare://knowledge/dermatology-appointment",
];

test("new knowledge resources are available and carry their clinical boundary", () => {
  const knowledgeBase = new MedicalKnowledgeBase();
  const listed = new Set(knowledgeBase.listResources());

  for (const uri of NEW_RESOURCE_URIS) {
    assert.ok(listed.has(uri), `${uri} is not listed`);

    const resource = knowledgeBase.getResource(uri);
    assert.ok(resource, `${uri} cannot be read`);
    assert.match(resource.disclaimer, /educational purposes only/i);
    assert.match(resource.disclaimer, /does not constitute medical advice/i);
    assert.equal(typeof resource.content.boundary, "string");
    assert.ok(resource.content.boundary.length > 0, `${uri} has no scope boundary`);
  }
});

test("new medical copy names dated, reputable sources", () => {
  const knowledgeBase = new MedicalKnowledgeBase();

  for (const uri of NEW_RESOURCE_URIS) {
    const resource = knowledgeBase.getResource(uri);
    assert.ok(Array.isArray(resource?.sources) && resource.sources.length > 0);

    for (const source of resource.sources) {
      assert.ok(source.title.length > 0, `${uri} has an unnamed source`);
      assert.ok(source.publisher.length > 0, `${uri} has an unnamed publisher`);
      assert.match(source.accessed, /^\d{4}-\d{2}-\d{2}$/);

      const sourceUrl = new URL(source.url);
      assert.equal(sourceUrl.protocol, "https:");
      assert.notEqual(sourceUrl.hostname, "example.com", `${uri} has a placeholder source`);
      assert.notEqual(sourceUrl.hostname, "localhost", `${uri} has a local source`);
    }
  }
});

test("new resources do not turn education into diagnosis or triage", () => {
  const knowledgeBase = new MedicalKnowledgeBase();
  const prohibited = [
    /seek urgent/i,
    /see (?:a |your )?(?:doctor|dermatologist) immediately/i,
    /within \d+ (?:hours?|days?|weeks?)/i,
    /likely (?:benign|malignant|cancer)/i,
    /risk score/i,
    /risk level/i,
  ];

  for (const uri of NEW_RESOURCE_URIS) {
    const resource = knowledgeBase.getResource(uri);
    const text = JSON.stringify(resource);
    for (const pattern of prohibited) {
      assert.doesNotMatch(text, pattern, `${uri} contains triage or a diagnostic verdict`);
    }
  }
});
