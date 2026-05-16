---
description: "Run Playwright tests by tag, file path, or project and report a structured summary of results."
---

You are a QA automation engineer running tests in the Saurabh.TestVagrant.AutomationSuite framework.

---

## Input Check

If `$ARGUMENTS` is empty, run the smoke suite as a safe default and state this clearly:

```
No arguments provided — running smoke suite as default.
To target specific tests: /run-tests --tag @smoke | /run-tests tests/ui/smoke/ | /run-tests --project api
```

---

## Pre-Run: Auth State Refresh

Do this step **before every run that includes UI tests**. Skip only when `--project api` is the sole target — API tests launch no browser and need no session.

Delete the auth state file if it exists, then let Playwright's globalSetup create a fresh session automatically:

```powershell
Remove-Item auth-state\standard-user.json -Force -ErrorAction SilentlyContinue
```

**Why always delete:** The SauceDemo session cookie expires within ~24 hours. GlobalSetup skips re-login when the file exists, so stale cookies cause silent redirects to the login page. Deleting before every run guarantees a fresh session. GlobalSetup runs once before any worker and recreates the file; all workers then read it (read-only). No race condition, safe for parallel execution.

---

## How to Run

Based on `$ARGUMENTS`, select the correct command:

| Input pattern | Command |
|---|---|
| `--tag @smoke` | `npx playwright test --grep @smoke` |
| `--tag @regression` | `npx playwright test --grep @regression` |
| `tests/ui/...` (file path) | `npx playwright test <path>` |
| `--project api` | `npx playwright test --project=api` |
| `--project ui-chrome` | `npx playwright test --project=ui-chrome` |
| `JIRA-1234` | `npx playwright test --grep JIRA-1234` |
| (empty) | `npx playwright test --grep @smoke` |

Always add `--reporter=list` for readable terminal output during the run.

---

## After the Run

Read `playwright-report/` and any `allure-results/` JSON files. Report:

```
Run Summary
───────────────────────────────
Project:    <project name>
Tests run:  <total>
Passed:     <count> ✅
Failed:     <count> ❌
Skipped:    <count> ⏭
Duration:   <hh:mm:ss>
───────────────────────────────

Failed Tests:
  ❌ <test name> — <error summary in one line>
  ❌ <test name> — <error summary in one line>

Next steps:
  - Run /analyze-results for AI root-cause analysis
  - Run /fix-and-rerun to apply fixes and re-run failed tests
```

If all tests pass: confirm success and suggest `/submit-pr` if the engineer is ready to push.

---

## Self-Update Mechanism

If the user corrects how tests should be run (e.g., additional flags, different defaults):

1. If it is a general rule, add to `## Learned Rules` using the Edit tool
2. Format: `- [date] <rule>`

---

## Learned Rules

<!-- Rules learned from user feedback are added here automatically -->
