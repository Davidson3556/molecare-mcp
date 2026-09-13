/**
 * Medical Knowledge Base
 * =======================
 *
 * Contains educational information about skin health, mole analysis,
 * and cancer prevention. This is NOT medical advice - always recommend
 * users consult healthcare professionals.
 *
 * Clinical terminology (SNOMED CT concepts, ICD-10 codes, and mappings)
 * lives in `src/api/ontology-client.ts` and the `molecare://ontology/*`
 * resources — see `terminology-provenance.ts` for named, dated sources.
 */

interface KnowledgeEntry {
  term: string;
  definition: string;
  details: string;
  significance: string;
  examples?: string[];
  /**
   * Extra search terms that a user is likely to type but that do not appear
   * in the prose above: acronyms, British spellings, and common synonyms.
   */
  keywords?: string[];
}

interface Resource {
  title: string;
  content: any;
  sources?: Array<{
    title: string;
    publisher: string;
    url: string;
    accessed: string;
  }>;
  disclaimer: string;
}

const KNOWLEDGE_BASE: Record<string, KnowledgeEntry> = {
  asymmetry: {
    term: "Asymmetry",
    keywords: ["abcde", "symmetry", "shape", "uneven"],
    definition: "When one half of a mole does not match the other half",
    details:
      "Benign moles are typically symmetric. If you draw a line through the middle, both halves should look similar. Asymmetry can be a warning sign that should be monitored.",
    significance:
      "Asymmetry is the 'A' in the ABCDE rule for melanoma detection. Significant asymmetry warrants professional evaluation.",
    examples: [
      "One side larger than the other",
      "Uneven shape",
      "Different texture on each half",
    ],
  },

  border: {
    term: "Border",
    keywords: ["abcde", "edge", "edges", "outline", "margin"],
    definition: "The edges or outline of a mole",
    details:
      "Healthy moles typically have smooth, even borders. Irregular, ragged, notched, or blurred borders can be concerning and should be monitored.",
    significance:
      "Border irregularity is the 'B' in the ABCDE rule. Borders that are poorly defined or spread into surrounding skin need attention.",
    examples: [
      "Scalloped edges",
      "Notched border",
      "Blurry or undefined edges",
    ],
  },

  color: {
    term: "Color",
    keywords: ["abcde", "colour", "pigment", "pigmentation"],
    definition: "The pigmentation within a mole",
    details:
      "Most benign moles are a single shade of brown. Multiple colors or uneven distribution of color can be a warning sign. Watch for shades of black, red, white, or blue.",
    significance:
      "Color variation is the 'C' in the ABCDE rule. Multiple colors in one mole, especially unusual colors, should be evaluated.",
    examples: [
      "Multiple shades of brown",
      "Areas of black pigment",
      "Red, white, or blue areas",
    ],
  },

  diameter: {
    term: "Diameter",
    keywords: ["abcde", "size", "width", "6mm", "large"],
    definition: "The size of a mole measured across its widest point",
    details:
      "Melanomas are often larger than 6mm (about the size of a pencil eraser) when diagnosed. However, they can be smaller when first detected.",
    significance:
      "Diameter is the 'D' in the ABCDE rule. Moles larger than 6mm should be monitored closely, though size alone is not diagnostic.",
    examples: [
      "Mole larger than a pencil eraser",
      "Growing mole",
      "Mole that was small but has increased in size",
    ],
  },

  evolution: {
    term: "Evolution",
    keywords: ["abcde", "change", "changing", "evolving", "growth"],
    definition: "Changes in a mole over time",
    details:
      "Any change in a mole's size, shape, color, elevation, or any new symptom such as bleeding, itching, or crusting can be significant.",
    significance:
      "Evolution is the 'E' in the ABCDE rule and is considered one of the most important warning signs. Any changing mole should be evaluated.",
    examples: [
      "Mole that has grown",
      "Change in color over months",
      "New symptoms like itching",
      "Bleeding without injury",
    ],
  },

  melanoma: {
    term: "Melanoma",
    keywords: ["skin cancer", "cancer", "malignant", "tumour", "tumor"],
    definition:
      "A type of skin cancer that develops from the cells that give skin its color",
    details:
      "Melanoma is the most serious type of skin cancer. It develops when the pigment-producing cells (melanocytes) mutate and become cancerous. Early detection is crucial for successful treatment.",
    significance:
      "When detected early, melanoma is highly treatable. Regular skin self-exams and professional screenings are important for early detection.",
    examples: [
      "New, unusual growth",
      "Existing mole that changes",
      "Sore that doesn't heal",
    ],
  },

  "skin-types": {
    term: "Fitzpatrick Skin Types",
    keywords: ["fitzpatrick", "skin type", "phototype", "burns"],
    definition: "A classification system for skin based on its response to sun exposure",
    details:
      "Type I: Very fair, always burns. Type II: Fair, usually burns. Type III: Medium, sometimes burns. Type IV: Olive, rarely burns. Type V: Brown, very rarely burns. Type VI: Dark brown/black, never burns.",
    significance:
      "People with lighter skin types (I-II) have higher risk of sun damage and skin cancer. All skin types need sun protection.",
    examples: [],
  },

  sunscreen: {
    term: "Sunscreen",
    keywords: ["spf", "sunblock", "suncream", "sun cream", "sun protection"],
    definition: "A product that protects skin from UV radiation damage",
    details:
      "SPF (Sun Protection Factor) indicates protection against UVB rays. Broad-spectrum sunscreens also protect against UVA rays. Apply generously 15-30 minutes before sun exposure.",
    significance:
      "Regular sunscreen use significantly reduces risk of skin cancer. SPF 30 or higher is recommended for extended outdoor activity.",
    examples: [
      "SPF 30+ for daily use",
      "SPF 50+ for extended outdoor activity",
      "Water-resistant for swimming",
    ],
  },

  "self-examination": {
    term: "Skin Self-Examination",
    keywords: ["self exam", "self-check", "mole check", "screening"],
    definition: "Regular checking of your own skin for new or changing moles",
    details:
      "Perform monthly self-exams. Use mirrors to check hard-to-see areas. Pay attention to any new moles or changes in existing ones. Document with photos.",
    significance:
      "Regular self-exams help detect skin cancer early when it's most treatable. Know your skin and report any concerns to your doctor.",
    examples: [
      "Check all skin including between toes",
      "Use a mirror for back examination",
      "Note location of all moles",
    ],
  },

  "uv-protection": {
    term: "UV Protection",
    keywords: ["uv", "ultraviolet", "sun safety", "shade", "sun protection"],
    definition: "Methods to protect skin from ultraviolet radiation",
    details:
      "UV protection includes sunscreen, protective clothing, seeking shade, and avoiding peak sun hours (10am-4pm). UV exposure is cumulative over lifetime.",
    significance:
      "UV radiation is the primary cause of skin cancer. Consistent protection is essential regardless of weather or season.",
    examples: [
      "Wear broad-brimmed hats",
      "Use UV-protective clothing",
      "Wear sunglasses",
    ],
  },
};

const RESOURCES: Record<string, Resource> = {
  "molecare://knowledge/abcde-criteria": {
    title: "ABCDE Criteria for Melanoma Detection",
    content: {
      overview:
        "The ABCDE rule is a helpful guide for identifying potentially cancerous moles.",
      criteria: [
        {
          letter: "A",
          name: "Asymmetry",
          description: "One half doesn't match the other",
          what_to_look_for: "Draw an imaginary line through the mole - do both halves match?",
        },
        {
          letter: "B",
          name: "Border",
          description: "Irregular, ragged, or blurred edges",
          what_to_look_for: "Are the edges smooth and even, or irregular and notched?",
        },
        {
          letter: "C",
          name: "Color",
          description: "Uneven color or multiple colors",
          what_to_look_for: "Is it one uniform color, or are there multiple shades or colors?",
        },
        {
          letter: "D",
          name: "Diameter",
          description: "Larger than 6mm (pencil eraser size)",
          what_to_look_for: "Is it larger than a pencil eraser? Has it grown?",
        },
        {
          letter: "E",
          name: "Evolution",
          description: "Changing in size, shape, or color",
          what_to_look_for: "Has the mole changed in any way over time?",
        },
      ],
      important_note:
        "Not all melanomas follow these rules, and not all moles with these features are cancerous. When in doubt, consult a dermatologist.",
    },
    disclaimer:
      "This information is for educational purposes only and does not constitute medical advice.",
  },

  "molecare://knowledge/skin-types": {
    title: "Fitzpatrick Skin Type Classification",
    content: {
      overview:
        "The Fitzpatrick scale classifies skin types based on response to UV exposure.",
      types: [
        {
          type: 1,
          description: "Very fair skin, light eyes, freckles",
          sunResponse: "Always burns, never tans",
          riskLevel: "Highest risk of sun damage",
        },
        {
          type: 2,
          description: "Fair skin, light eyes",
          sunResponse: "Usually burns, tans minimally",
          riskLevel: "High risk of sun damage",
        },
        {
          type: 3,
          description: "Medium skin tone",
          sunResponse: "Sometimes burns, tans gradually",
          riskLevel: "Moderate risk of sun damage",
        },
        {
          type: 4,
          description: "Olive skin tone",
          sunResponse: "Rarely burns, tans easily",
          riskLevel: "Lower risk, still needs protection",
        },
        {
          type: 5,
          description: "Brown skin tone",
          sunResponse: "Very rarely burns, tans very easily",
          riskLevel: "Lower risk, still needs protection",
        },
        {
          type: 6,
          description: "Dark brown to black skin",
          sunResponse: "Never burns",
          riskLevel: "Lowest risk, but still possible",
        },
      ],
      recommendation:
        "All skin types benefit from sun protection. Lighter skin types need extra vigilance.",
    },
    disclaimer:
      "This information is for educational purposes only and does not constitute medical advice.",
  },

  "molecare://knowledge/prevention-tips": {
    title: "Skin Cancer Prevention Tips",
    content: {
      dailyHabits: [
        "Apply broad-spectrum SPF 30+ sunscreen daily, even on cloudy days",
        "Reapply sunscreen every 2 hours when outdoors",
        "Wear protective clothing, including wide-brimmed hats",
        "Seek shade during peak UV hours (10am-4pm)",
        "Wear UV-blocking sunglasses",
      ],
      selfExamination: [
        "Perform monthly skin self-exams",
        "Use mirrors to check hard-to-see areas",
        "Take photos of moles to track changes",
        "Note any new moles or changes in existing ones",
        "Check skin from head to toe, including scalp and between toes",
      ],
      professionalCare: [
        "Schedule annual skin exams with a dermatologist",
        "More frequent exams if you have risk factors",
        "Report any concerning changes immediately",
        "Don't wait for symptoms to worsen",
      ],
      thingsToAvoid: [
        "Avoid tanning beds and sunlamps",
        "Don't stay in the sun until you burn",
        "Avoid peak sun exposure without protection",
        "Don't ignore changing moles",
      ],
    },
    disclaimer:
      "This information is for educational purposes only and does not constitute medical advice.",
  },

  "molecare://knowledge/when-to-see-doctor": {
    title: "When to See a Dermatologist",
    content: {
      seeImmediately: [
        "A mole that is rapidly changing",
        "A mole that bleeds without injury",
        "A new, rapidly growing lesion",
        "A sore that doesn't heal within 3 weeks",
        "Any mole with high-risk ABCDE features",
      ],
      scheduleAppointment: [
        "Any new mole after age 30",
        "A mole that looks different from your other moles",
        "Gradual changes in an existing mole",
        "Family history of melanoma",
        "Personal history of skin cancer",
        "Many moles (50+)",
        "History of blistering sunburns",
      ],
      routineScreening: [
        "Annual skin exam for everyone",
        "More frequent for high-risk individuals",
        "After finding any suspicious mole",
        "If you work outdoors frequently",
      ],
      whatToExpect:
        "A dermatologist will examine your skin, possibly using a dermatoscope (magnifying device). They may photograph moles for monitoring or perform a biopsy if needed.",
    },
    disclaimer:
      "This information is for educational purposes only and does not constitute medical advice. When in doubt, always consult a healthcare professional.",
  },

  "molecare://knowledge/sun-protection": {
    title: "Understanding SPF and Sun Protection",
    content: {
      overview:
        "Sun protection combines shade, clothing, sunglasses, and sunscreen. Sunscreen does not provide complete protection on its own.",
      labels: {
        spf:
          "Sun protection factor (SPF) describes protection against ultraviolet B (UVB) radiation under test conditions. It does not describe UVA protection.",
        uva:
          "On UK labels, look for at least four UVA stars or the letters UVA inside a circle. 'Broad spectrum' means the product provides both UVA and UVB protection.",
      },
      sunscreenUse: [
        "Use at least SPF 30 on exposed skin and apply enough to achieve the protection stated on the label.",
        "Reapply liberally and frequently, following the product instructions. Reapply after swimming, towel drying, sweating, or when the product may have rubbed off.",
        "The NHS also recommends reapplying every two hours while exposed to the sun.",
      ],
      otherProtection: [
        "Spend time in shade when the sun is strongest.",
        "Use covering clothing, a wide-brimmed hat, and suitable sunglasses.",
        "Do not use sunscreen as a reason to stay in the sun longer.",
      ],
      boundary:
        "Product labels and public-health recommendations vary by country. Follow the instructions on the sunscreen and use local UV guidance.",
    },
    sources: [
      {
        title: "Sunscreen and sun safety",
        publisher: "NHS",
        url: "https://www.nhs.uk/live-well/seasonal-health/sunscreen-and-sun-safety/",
        accessed: "2026-09-13",
      },
    ],
    disclaimer:
      "This information is for educational purposes only and does not constitute medical advice.",
  },

  "molecare://knowledge/common-benign-lesions": {
    title: "Common Benign Skin Lesions",
    content: {
      overview:
        "Benign means non-cancerous. Many benign growths have recognisable patterns, but a written description or photograph cannot confirm what a skin lesion is.",
      examples: [
        {
          name: "Seborrhoeic keratosis",
          description:
            "A common non-cancerous growth that may have a waxy or wart-like surface and can range from pale to dark brown or black.",
          limitation:
            "Its appearance can overlap with actinic keratosis and some skin cancers.",
        },
        {
          name: "Cherry angioma",
          description:
            "A common small vascular growth that is often red to purple and may be flat or raised.",
          limitation: "Other vascular or pigmented lesions can have a similar colour.",
        },
        {
          name: "Dermatofibroma",
          description:
            "A firm papule or small nodule that is often pink, tan, or brown and commonly appears on the limbs.",
          limitation: "Some atypical lesions can resemble a dermatofibroma.",
        },
        {
          name: "Skin tag (acrochordon)",
          description:
            "A soft, flesh-coloured growth that often hangs from the skin on a small stalk.",
          limitation: "A clinician can distinguish it from other raised growths when the appearance is unclear.",
        },
      ],
      clinicalAssessment: [
        "Clinicians consider a lesion's history, distribution, and appearance rather than relying on one visual feature.",
        "They may use a dermatoscope for a closer view. If uncertainty remains, a biopsy can allow tissue to be examined under a microscope.",
      ],
      boundary:
        "These are examples of common appearances, not a diagnostic checklist. A lesion should not be labelled benign from this resource alone.",
    },
    sources: [
      {
        title: "Seborrheic keratoses: Overview",
        publisher: "American Academy of Dermatology",
        url: "https://www.aad.org/public/diseases/a-z/seborrheic-keratoses-overview",
        accessed: "2026-09-13",
      },
      {
        title: "Common benign skin lesions",
        publisher: "DermNet",
        url: "https://dermnetnz.org/topics/benign-skin-lesions",
        accessed: "2026-09-13",
      },
      {
        title: "Diagnosing Common Benign Skin Tumors",
        publisher: "American Family Physician",
        url: "https://www.aafp.org/pubs/afp/issues/2015/1001/p601.html",
        accessed: "2026-09-13",
      },
    ],
    disclaimer:
      "This information is for educational purposes only and does not constitute medical advice or a diagnosis.",
  },

  "molecare://knowledge/skin-self-examination": {
    title: "Skin Self-Examination Technique",
    content: {
      purpose:
        "A skin self-examination helps you become familiar with your skin and record visible changes. It cannot determine whether a lesion is benign or cancerous.",
      equipment: [
        "A full-length mirror",
        "A hand mirror",
        "Good, even lighting",
        "A body map or another consistent way to record locations",
      ],
      sequence: [
        "Look at the front and back of your body in a full-length mirror, then raise your arms and check both sides.",
        "Check your underarms, forearms, palms, fingers, and fingernails.",
        "Check the front and back of your legs, your feet, between your toes, your toenails, and the soles of your feet.",
        "Use a hand mirror to check the back of your neck and your scalp, parting the hair to see the skin.",
        "Use a hand mirror or ask someone you trust to help check areas that are hard to see, such as your back.",
      ],
      recording: [
        "Record the date and location of a spot so later observations can be compared with the same area.",
        "If you use photographs, keep the lighting, distance, and scale as consistent as possible.",
        "Photographs are a record for comparison, not a diagnosis.",
      ],
      frequency:
        "How often to examine your skin depends on personal history and professional advice; there is no single schedule in this resource.",
      boundary:
        "Self-examination does not replace a professional skin examination. A healthcare professional can assess a new or changing area in clinical context.",
    },
    sources: [
      {
        title: "Find skin cancer: How to perform a skin self-exam",
        publisher: "American Academy of Dermatology",
        url: "https://www.aad.org/public/diseases/skin-cancer/check-skin",
        accessed: "2026-09-13",
      },
      {
        title: "How to take pictures of your skin for your dermatologist",
        publisher: "American Academy of Dermatology",
        url: "https://www.aad.org/public/fad/digital-health/taking-pictures-skin",
        accessed: "2026-09-13",
      },
    ],
    disclaimer:
      "This information is for educational purposes only and does not constitute medical advice or a diagnosis.",
  },

  "molecare://knowledge/dermatology-appointment": {
    title: "What to Expect at a Dermatology Appointment",
    content: {
      beforeTheVisit: [
        "Note what you want the clinician to examine and how long you have noticed it.",
        "Be ready to describe visible changes or symptoms and provide relevant medical history, family history, allergies, and medicines.",
        "Bring earlier photographs if they clearly show how the same area has changed.",
      ],
      duringTheVisit: [
        "The clinician will ask about the concern and examine the affected skin and nearby area.",
        "A full skin examination, when arranged, may include the scalp and nails as well as the rest of the skin.",
        "A dermatologist may use a dermatoscope, a magnifying device that provides a closer view of skin structures.",
      ],
      possibleNextSteps: [
        "Not every mole or growth needs a biopsy.",
        "When a closer laboratory examination is needed, a clinician may numb the area, remove a small skin sample, and send it for examination under a microscope.",
        "The clinician should explain how results or follow-up information will be provided.",
      ],
      boundary:
        "Appointments differ according to the reason for referral and the service providing care. This overview does not predict which examination or test an individual will receive.",
    },
    sources: [
      {
        title: "Skin cancer: Symptoms, diagnosis, and causes",
        publisher: "American Academy of Dermatology",
        url: "https://www.aad.org/public/diseases/skin-cancer",
        accessed: "2026-09-13",
      },
      {
        title: "What to expect at a skin cancer check",
        publisher: "American Academy of Dermatology",
        url: "https://www.aad.org/public/public-health/skin-cancer-screenings/what-to-expect",
        accessed: "2026-09-13",
      },
      {
        title: "Skin biopsy",
        publisher: "University College London Hospitals NHS Foundation Trust",
        url: "https://www.uclh.nhs.uk/patients-and-visitors/patient-information-pages/skin-biopsy",
        accessed: "2026-09-13",
      },
    ],
    disclaimer:
      "This information is for educational purposes only and does not constitute medical advice or a diagnosis.",
  },
};

/**
 * Rank an entry against a query.
 *
 * Fields are weighted so that a name match beats a passing mention in the
 * prose: searching "melanoma" should return the Melanoma entry, not whichever
 * ABCDE criterion happens to mention melanoma first. Every field is searched,
 * including `significance` and `examples` — leaving `significance` out was why
 * "ABCDE" returned nothing, since that is the only field naming the acronym.
 */
function scoreEntry(key: string, entry: KnowledgeEntry, query: string): number {
  const keywords = (entry.keywords || []).map((k) => k.toLowerCase());
  const name = `${key.replace(/-/g, " ")} ${entry.term}`.toLowerCase();

  // An exact hit on the entry's name or one of its synonyms wins outright.
  let score = 0;
  if (name.split(" ").includes(query) || entry.term.toLowerCase() === query || keywords.includes(query)) {
    score += 100;
  }

  const fields: Array<[string, number]> = [
    [name, 10],
    [keywords.join(" "), 8],
    [entry.definition.toLowerCase(), 4],
    [
      `${entry.details} ${entry.significance} ${(entry.examples || []).join(" ")}`.toLowerCase(),
      2,
    ],
  ];

  const words = query.split(/\s+/).filter((w) => w.length > 2);

  for (const [text, weight] of fields) {
    if (!text) continue;
    if (text.includes(query)) score += weight * 2; // whole phrase
    for (const word of words) {
      if (text.includes(word)) score += weight;
    }
  }

  return score;
}

export class MedicalKnowledgeBase {
  /**
   * Search the knowledge base for relevant information
   */
  search(query: string): KnowledgeEntry[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    const scored = Object.entries(KNOWLEDGE_BASE)
      .map(([key, entry]) => ({ entry, score: scoreEntry(key, entry, normalizedQuery) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);

    // `keywords` is search plumbing, not medical content - keep it out of the
    // response so the tool's output shape is unchanged.
    return scored.slice(0, 5).map(({ entry: { keywords, ...entry } }) => entry);
  }

  /**
   * Get a specific resource by URI
   */
  getResource(uri: string): Resource | null {
    return RESOURCES[uri] || null;
  }

  /**
   * Get all available resource URIs
   */
  listResources(): string[] {
    return Object.keys(RESOURCES);
  }
}
