# Contract: Content file `data/levels.json`

The authored interface between content reviewers and the engine (Principle VI). The field rules are
in [../data-model.md](../data-model.md). This file gives the shape and one complete round.

```jsonc
{
  "schemaVersion": 1,
  "sources": [
    {
      "id": "foa-otdr-faq",
      "title": "FOA Reference – OTDR FAQs",
      "url": "https://www.thefoa.org/tech/ref/testing/OTDR/OTDR-FAQS.html",
      "section": "Systematic Errors",
      "claim": "An OTDR measures the length of the fiber, not the cable."
    }
  ],
  "levels": [
    {
      "id": "L2",
      "title": "Mind the slack",
      "learningOutcome": "LO2",
      "briefing": {
        "paragraphs": ["Crews leave extra cable coiled in manholes…"],
        "workedExample": "Break at 1.530 km; MH-1 at 1.000 km stores 0.050 km… → 1.480 km down the street.",
        "limits": ["Real OTDR distances are only accurate to about ±2%; crews confirm against records."]
      },
      "sourceIds": ["foa-otdr", "foa-otdr-faq", "foa-restoration"],
      "rounds": [
        {
          "id": "L2R1",
          "title": "Three manholes, three coils",
          "testEnd": "A",
          "route": {
            "points": [
              { "id": "CO-A", "kind": "co",      "groundM": 0 },
              { "id": "MH-1", "kind": "manhole", "groundM": 1000, "slackM": 50 },
              { "id": "MH-2", "kind": "manhole", "groundM": 2000, "slackM": 50 },
              { "id": "MH-3", "kind": "manhole", "groundM": 3000, "slackM": 50 },
              { "id": "CO-Z", "kind": "co",      "groundM": 4000 }
            ]
          },
          "trace": {
            "wavelengthNm": 1550,
            "attenuationDbPerKm": 0.2,
            "events": [
              { "id": "e0", "type": "launch", "distanceM": 0,    "reflective": true },
              { "id": "e1", "type": "end",    "distanceM": 3060, "reflective": false }
            ]
          },
          "hints": [
            "OTDR distance is cable length. Add up the slack stored in each manhole the cable passes before you compare with street distances.",
            "MH-1 and MH-2 each store 0.050 km, so MH-3 is at 3.000 + 0.100 = 3.100 km of cable.",
            "3.060 km is between MH-2 (leaves at 2.100 km of cable) and MH-3 (3.100 km). Dispatch to span MH-2 → MH-3, 40 m short of MH-3."
          ]
        }
      ]
    }
  ]
}
```

**Compatibility:** v1 accepts only `schemaVersion: 1`. Unknown fields are ignored. Missing required
fields are content errors. The final file must be plain JSON, without the comments shown here.

**Briefing worked examples** must use values that appear in no round (the example above, 1.530 km,
is not a round value).
