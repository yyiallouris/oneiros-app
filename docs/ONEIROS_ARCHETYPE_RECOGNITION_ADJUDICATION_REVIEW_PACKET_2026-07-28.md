# Oneiros Archetype Recognition Adjudication Review Packet

Date: `2026-07-28`  
Status: `blocked by upstream quota`  
Scope: live 2-stage standalone archetype spike packet for discovery `1.0.0` + adjudication `1.0.0`

## Executive summary

This run did **not** produce semantic archetype results. The batch was blocked before any discovery response could be validated, because every discovery request returned:

- HTTP `429`
- provider error type `insufficient_quota`
- failure stage `discovery_http`

Because discovery never succeeded, adjudication never had candidates to evaluate.

## Exact run config

- Task chain: `dream_archetype_recognition → dream_archetype_adjudication`
- Discovery prompt version: `1.0.0`
- Discovery schema version: `1`
- Recognition catalog version: `2.0.0`
- Adjudication prompt version: `1.0.0`
- Adjudication schema version: `1`
- Boundary catalog version: `1.0.0`
- Discovery model: `gpt-5.4-mini-2026-03-17`
- Adjudication model: `gpt-5.4-mini-2026-03-17`
- Discovery temperature: `0`
- Adjudication temperature: `0`
- Concurrency: `2`
- Fixture count: `18`
- Planned semantic runs: `80`
- Generated at: `2026-07-28T15:16:38.403Z`
- Output dir: [tmp/archetype-recognition-adjudication-2026-07-28T15-15-09-521Z](/Users/yiannisyiallouris/Documents/perso/oneiros-app/tmp/archetype-recognition-adjudication-2026-07-28T15-15-09-521Z)
- Raw packet source: [review_packet.json](/Users/yiannisyiallouris/Documents/perso/oneiros-app/tmp/archetype-recognition-adjudication-2026-07-28T15-15-09-521Z/review_packet.json)

## Top-line result

- Successful semantic runs: `0/80`
- Failed semantic runs: `80/80`
- Dominant failure stage: `discovery_http` in `80/80` failed runs
- Net interpretation value: **no model-behavior conclusion is licensed from this batch** because the failure mode is operational, not semantic

## Stage histogram

| Stage | Count |
|---|---:|
| `discovery_http` | 80 |

## Representative upstream error

- HTTP status: `429`
- Latency ms: `2840`
- Error excerpt:

```text
{
    "error": {
        "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.",
        "type": "insufficient_quota",
        "param": null,
        
```

## Fixture-level acceptance summary

| Fixture | Successful runs | Pass | Failure condition(s) |
|---|---:|---|---|
| `sea_mattress_el_exact` | 0 | fail | required recall 0/0 < 5; exact set 0/0 < 5 |
| `sea_mattress_el_boyfriend_diag` | 0 | fail | required recall 0/0 < 3; exact set 0/0 < 3 |
| `lover_harmonious_en` | 0 | fail | required recall 0/0 < 4 |
| `lover_longing_en` | 0 | fail | required recall 0/0 < 2 |
| `warm_friends_en` | 0 | fail | exact set 0/0 < 5 |
| `warm_friends_el` | 0 | fail | exact set 0/0 < 5 |
| `lover_negative_naturalistic_en` | 0 | fail | exact set 0/0 < 5 |
| `incidental_partner_en` | 0 | fail | exact set 0/0 < 5 |
| `romance_cue_only_en` | 0 | fail | exact set 0/0 < 5 |
| `guide_positive_en` | 0 | fail | required recall 0/0 < 4 |
| `guide_negative_carrier_only_en` | 0 | fail | exact set 0/0 < 5 |
| `shadow_positive_en` | 0 | fail | required recall 0/0 < 4 |
| `shadow_negative_danger_only_en` | 0 | fail | exact set 0/0 < 5 |
| `persona_positive_en` | 0 | fail | required recall 0/0 < 4 |
| `persona_carrier_only_en` | 0 | fail | exact set 0/0 < 5 |
| `mother_positive_en` | 0 | fail | required recall 0/0 < 2 |
| `father_positive_en` | 0 | fail | required recall 0/0 < 2 |
| `divine_child_positive_en` | 0 | fail | required recall 0/0 < 2 |

## Reviewer interpretation

- The discovery → adjudication pipeline implementation is present locally, but this live packet does **not** evaluate precision or recall.
- Every fixture failed for the same operational reason before any discovery JSON existed.
- No fixture-specific semantic conclusion should be drawn from the zeros in this packet.
- The correct next action is to restore usable quota for the configured discovery model path and rerun the exact same runner unchanged.

## Console stdout summary

```json
{
  "outDir": "tmp/archetype-recognition-adjudication-2026-07-28T15-15-09-521Z",
  "acceptance": [
    {
      "fixture_id": "sea_mattress_el_exact",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 5",
        "exact set 0/0 < 5"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2840,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 3352,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2227,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2709,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2450,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "sea_mattress_el_boyfriend_diag",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 3",
        "exact set 0/0 < 3"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2281,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2535,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2254,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "lover_harmonious_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 4"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2188,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2218,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2283,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2248,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2256,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "lover_longing_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 2"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2258,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2138,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2337,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "warm_friends_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "exact set 0/0 < 5"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2271,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2200,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2292,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2106,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2227,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "warm_friends_el",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "exact set 0/0 < 5"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2243,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2138,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2221,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2444,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2196,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "lover_negative_naturalistic_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "exact set 0/0 < 5"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2332,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2228,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2180,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2203,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2179,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "incidental_partner_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "exact set 0/0 < 5"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2106,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2094,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2033,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2166,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2333,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "romance_cue_only_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "exact set 0/0 < 5"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2128,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2118,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2003,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2095,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2349,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "guide_positive_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 4"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2124,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2081,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2128,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2151,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2393,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "guide_negative_carrier_only_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "exact set 0/0 < 5"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2180,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2177,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2236,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2095,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2165,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "shadow_positive_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 4"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2223,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2147,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2308,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2257,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2263,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "shadow_negative_danger_only_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "exact set 0/0 < 5"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2236,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2205,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2268,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2211,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2175,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "persona_positive_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 4"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2019,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2136,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2195,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2109,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2135,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "persona_carrier_only_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "exact set 0/0 < 5"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2179,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2139,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 1991,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 1868,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2204,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "mother_positive_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 2"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2099,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2043,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2214,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "father_positive_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 2"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2056,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2151,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2106,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "divine_child_positive_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 2"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2165,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2105,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2075,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    }
  ]
}
```

## Full raw review packet

```json
{
  "generated_at": "2026-07-28T15:16:38.403Z",
  "task": "dream_archetype_recognition → dream_archetype_adjudication",
  "discovery_prompt_version": "1.0.0",
  "discovery_response_schema_version": "1",
  "recognition_catalog_version": "2.0.0",
  "adjudication_prompt_version": "1.0.0",
  "adjudication_response_schema_version": "1",
  "boundary_catalog_version": "1.0.0",
  "discovery_model": "gpt-5.4-mini-2026-03-17",
  "adjudication_model": "gpt-5.4-mini-2026-03-17",
  "discovery_temperature": 0,
  "adjudication_temperature": 0,
  "concurrency": 2,
  "fixture_count": 18,
  "planned_semantic_runs": 80,
  "results": [
    {
      "fixture_id": "sea_mattress_el_exact",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2840,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "sea_mattress_el_exact",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 3352,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "sea_mattress_el_exact",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2227,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "sea_mattress_el_exact",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2709,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "sea_mattress_el_exact",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2450,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "sea_mattress_el_boyfriend_diag",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2281,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "sea_mattress_el_boyfriend_diag",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2535,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "sea_mattress_el_boyfriend_diag",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2254,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "lover_harmonious_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2188,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "lover_harmonious_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2218,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "lover_harmonious_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2283,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "lover_harmonious_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2248,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "lover_harmonious_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2256,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "lover_longing_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2258,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "lover_longing_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2138,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "lover_longing_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2337,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "warm_friends_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2271,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "warm_friends_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2200,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "warm_friends_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2292,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "warm_friends_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2106,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "warm_friends_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2227,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "warm_friends_el",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2243,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "warm_friends_el",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2138,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "warm_friends_el",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2221,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "warm_friends_el",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2444,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "warm_friends_el",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2196,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "lover_negative_naturalistic_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2332,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "lover_negative_naturalistic_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2228,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "lover_negative_naturalistic_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2180,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "lover_negative_naturalistic_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2203,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "lover_negative_naturalistic_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2179,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "incidental_partner_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2106,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "incidental_partner_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2094,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "incidental_partner_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2033,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "incidental_partner_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2166,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "incidental_partner_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2333,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "romance_cue_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2128,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "romance_cue_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2118,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "romance_cue_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2003,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "romance_cue_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2095,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "guide_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2124,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "romance_cue_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2349,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "guide_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2081,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "guide_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2128,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "guide_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2151,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "guide_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2393,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "guide_negative_carrier_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2180,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "guide_negative_carrier_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2177,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "guide_negative_carrier_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2236,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "guide_negative_carrier_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2095,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "guide_negative_carrier_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2165,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "shadow_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2223,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "shadow_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2147,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "shadow_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2308,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "shadow_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2257,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "shadow_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2263,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "shadow_negative_danger_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2236,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "shadow_negative_danger_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2205,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "shadow_negative_danger_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2268,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "shadow_negative_danger_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2211,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "shadow_negative_danger_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2175,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "persona_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2019,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "persona_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2136,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "persona_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2195,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "persona_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2109,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "persona_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2135,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "persona_carrier_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2179,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "persona_carrier_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2139,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "persona_carrier_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 1991,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "persona_carrier_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 1868,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "persona_carrier_only_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2204,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "mother_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2099,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "mother_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2043,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "mother_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2214,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "father_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2056,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "father_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2151,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "father_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2106,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "divine_child_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2165,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "divine_child_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2105,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    },
    {
      "fixture_id": "divine_child_positive_en",
      "semantic_success": false,
      "stage": "discovery_http",
      "status": 429,
      "latency_ms": 2075,
      "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
    }
  ],
  "acceptance": [
    {
      "fixture_id": "sea_mattress_el_exact",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 5",
        "exact set 0/0 < 5"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2840,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 3352,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2227,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2709,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2450,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "sea_mattress_el_boyfriend_diag",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 3",
        "exact set 0/0 < 3"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2281,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2535,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2254,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "lover_harmonious_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 4"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2188,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2218,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2283,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2248,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2256,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "lover_longing_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 2"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2258,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2138,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2337,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "warm_friends_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "exact set 0/0 < 5"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2271,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2200,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2292,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2106,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2227,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "warm_friends_el",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "exact set 0/0 < 5"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2243,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2138,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2221,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2444,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2196,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "lover_negative_naturalistic_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "exact set 0/0 < 5"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2332,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2228,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2180,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2203,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2179,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "incidental_partner_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "exact set 0/0 < 5"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2106,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2094,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2033,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2166,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2333,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "romance_cue_only_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "exact set 0/0 < 5"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2128,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2118,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2003,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2095,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2349,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "guide_positive_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 4"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2124,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2081,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2128,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2151,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2393,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "guide_negative_carrier_only_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "exact set 0/0 < 5"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2180,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2177,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2236,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2095,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2165,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "shadow_positive_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 4"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2223,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2147,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2308,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2257,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2263,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "shadow_negative_danger_only_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "exact set 0/0 < 5"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2236,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2205,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2268,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2211,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2175,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "persona_positive_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 4"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2019,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2136,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2195,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2109,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2135,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "persona_carrier_only_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "exact set 0/0 < 5"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2179,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2139,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 1991,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 1868,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2204,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "mother_positive_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 2"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2099,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2043,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2214,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "father_positive_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 2"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2056,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2151,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2106,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    },
    {
      "fixture_id": "divine_child_positive_en",
      "successful_runs": 0,
      "exact_set_pass_count": 0,
      "required_hit_count": 0,
      "unexpected_label_runs": 0,
      "pass": false,
      "failures": [
        "required recall 0/0 < 2"
      ],
      "semantic_failures": [
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2165,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2105,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        },
        {
          "stage": "discovery_http",
          "status": 429,
          "latency_ms": 2075,
          "error_excerpt": "{\n    \"error\": {\n        \"message\": \"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.\",\n        \"type\": \"insufficient_quota\",\n        \"param\": null,\n        "
        }
      ]
    }
  ],
  "exact_set_pass_rate": "0/0",
  "required_label_recall": {
    "sea_mattress_el_exact": "0/5",
    "sea_mattress_el_boyfriend_diag": "0/3",
    "lover_harmonious_en": "0/5",
    "lover_longing_en": "0/3",
    "guide_positive_en": "0/5",
    "shadow_positive_en": "0/5",
    "persona_positive_en": "0/5",
    "mother_positive_en": "0/3",
    "father_positive_en": "0/3",
    "divine_child_positive_en": "0/3"
  },
  "unexpected_label_false_positive_rate": "0/0",
  "per_label_confusion": {
    "lover": {
      "expected_positive_runs": 0,
      "true_positive_runs": 0,
      "false_negative_runs": 0,
      "false_positive_runs": 0,
      "returned_runs": 0
    },
    "guide_psychopomp": {
      "expected_positive_runs": 0,
      "true_positive_runs": 0,
      "false_negative_runs": 0,
      "false_positive_runs": 0,
      "returned_runs": 0
    },
    "shadow": {
      "expected_positive_runs": 0,
      "true_positive_runs": 0,
      "false_negative_runs": 0,
      "false_positive_runs": 0,
      "returned_runs": 0
    },
    "persona": {
      "expected_positive_runs": 0,
      "true_positive_runs": 0,
      "false_negative_runs": 0,
      "false_positive_runs": 0,
      "returned_runs": 0
    },
    "mother": {
      "expected_positive_runs": 0,
      "true_positive_runs": 0,
      "false_negative_runs": 0,
      "false_positive_runs": 0,
      "returned_runs": 0
    },
    "father": {
      "expected_positive_runs": 0,
      "true_positive_runs": 0,
      "false_negative_runs": 0,
      "false_positive_runs": 0,
      "returned_runs": 0
    },
    "divine_child": {
      "expected_positive_runs": 0,
      "true_positive_runs": 0,
      "false_negative_runs": 0,
      "false_positive_runs": 0,
      "returned_runs": 0
    }
  },
  "fixture_hashes": [
    {
      "fixture_id": "sea_mattress_el_exact",
      "sha256": "6489c447cdbad00d05cc6935fff45a9de3198995aac0d2aa84ff1c49d3559f4d",
      "repeats": 5
    },
    {
      "fixture_id": "sea_mattress_el_boyfriend_diag",
      "sha256": "b836b082c7b4df0be72645c65ea4612b86c6504e58eb0a0ee50ac41909515a92",
      "repeats": 3
    },
    {
      "fixture_id": "lover_harmonious_en",
      "sha256": "d3d86773575ff4c5ed63cfc07fe56a158e556624c37209434deffb0ef22933d8",
      "repeats": 5
    },
    {
      "fixture_id": "lover_longing_en",
      "sha256": "d99025479ff32d816a0a4f7c82e4321bd08467e0f6f8a13e68bb80210a963850",
      "repeats": 3
    },
    {
      "fixture_id": "warm_friends_en",
      "sha256": "dc99c5fefcce976181410bb6037584b22da9ffbac795fb4c83eedb697e955a16",
      "repeats": 5
    },
    {
      "fixture_id": "warm_friends_el",
      "sha256": "688b706ae741218e37088a51f18fc8ce2e6c96c67b921aae180ccbb933d7616b",
      "repeats": 5
    },
    {
      "fixture_id": "lover_negative_naturalistic_en",
      "sha256": "67ce2eb23f1deb5e0ac45f69422b55b0ed2f8b6b87c1838139912db57386eb2d",
      "repeats": 5
    },
    {
      "fixture_id": "incidental_partner_en",
      "sha256": "6d633f10943f9ddb2716e4f0d033ed0a495264c867824220a3464a2e017c757c",
      "repeats": 5
    },
    {
      "fixture_id": "romance_cue_only_en",
      "sha256": "df2e61c9fc04f71b91bbfba725953deb3de734390b48425b68d38b263bbcaaf1",
      "repeats": 5
    },
    {
      "fixture_id": "guide_positive_en",
      "sha256": "4e914df15083dcff5d9d4e6fd8a35fc1e3aac7eb9f0aec103582138bed4c80cc",
      "repeats": 5
    },
    {
      "fixture_id": "guide_negative_carrier_only_en",
      "sha256": "6b3878cad933927253cf7159ea7e8001878ad2b47e28e91b6ec4b67a74094d48",
      "repeats": 5
    },
    {
      "fixture_id": "shadow_positive_en",
      "sha256": "da1620d0d8516c754f7ff366c6dfe7b0bddca6bb1ae0a48cc5b950ff5b62ac55",
      "repeats": 5
    },
    {
      "fixture_id": "shadow_negative_danger_only_en",
      "sha256": "ac0c110685c2834cfdabe411ecd9e71b9f5eb770ae76310132cf7732ec54423a",
      "repeats": 5
    },
    {
      "fixture_id": "persona_positive_en",
      "sha256": "21696c586beb53e4cef677e7635fe2db9e8a5ed540d864482a3218ec9b84cb51",
      "repeats": 5
    },
    {
      "fixture_id": "persona_carrier_only_en",
      "sha256": "69ce4967cee69d1e59e7696cfecc7a85c4b9b22b22ba5ddb2ad07332bc98c0dc",
      "repeats": 5
    },
    {
      "fixture_id": "mother_positive_en",
      "sha256": "13ba35334a2aeb27235519c26e3e29401ff9bf1d37543db36cc74d7130b8ef28",
      "repeats": 3
    },
    {
      "fixture_id": "father_positive_en",
      "sha256": "216396a720b16afa0cd310f0680d59203380927aee48903e58d3db77fab554d8",
      "repeats": 3
    },
    {
      "fixture_id": "divine_child_positive_en",
      "sha256": "064b042c2f9a7f3908633d92feef23fd311be23761c0ac82c8ec468118f661ef",
      "repeats": 3
    }
  ]
}
```
