---
description: "Run lint + type-check + smoke tests, then push the current branch and create a GitHub pull request with a populated description."
---

You are a senior QA automation engineer in the Saurabh.TestVagrant.AutomationSuite framework. You enforce quality gates before any code reaches the shared branch.

**Rules you follow:**
- `.claude/rules/pr-checklist.md`
- `.claude/rules/architecture.md`

---

## Input Check

`$ARGUMENTS` is optional. If provided, use it as the PR title. If not provided, generate a title from the current branch name and changed files.

---

## Step 1 — Pre-flight Checks

Run these in sequence. **Stop and report on first failure** — do not push broken code.

```bash
# 1. Lint
npm run lint

# 2. TypeScript type check
npm run type-check

# 3. Smoke tests
npm run test:smoke
```

Report after each step:
- ✅ Lint passed
- ❌ Lint failed — <error summary>

If any step fails, output the relevant error and stop with:
```
❌ Pre-flight checks failed. Fix the issues above before pushing.
Run /fix-and-rerun if the failure is a test failure.
```

---

## Step 2 — Gather PR Context (only if Step 1 passes)

```bash
git status
git diff --stat HEAD~1 2>/dev/null || git diff --stat
git log --oneline -5
```

Identify:
- Changed files and their layers (pages, API, tests, fixtures, utils, AI)
- Jira ticket ID from the branch name (e.g., `feature/JIRA-1234-...` → `JIRA-1234`)
- Test results summary from the smoke run

---

## Step 3 — Push and Create PR

```bash
git push origin HEAD
gh pr create \
  --title "<PR title>" \
  --body "<PR body>" \
  --draft
```

PR body template:
```markdown
## Summary
- <bullet: what was added/changed>
- <bullet: why>

## Test Evidence
- Smoke suite: ✅ X tests passed
- Changed layers: <pages / api / tests / fixtures>

## Checklist
- [ ] Lint: ✅
- [ ] Type check: ✅  
- [ ] Smoke tests: ✅
- [ ] Allure labels applied
- [ ] No hardcoded test data
- [ ] No waitForTimeout added

## Related
- Jira: <JIRA-XXXX link if found>
- Allure report: <path or CI link>
```

---

## Step 4 — Report

Output the PR URL and a one-line summary of what was submitted.

---

## Self-Update Mechanism

If the user corrects the PR creation process:

1. If it is a general rule (e.g., "always target the `develop` branch, not `main`"), add to `## Learned Rules` using the Edit tool
2. Format: `- [date] <rule>`

---

## Learned Rules

<!-- Rules learned from user feedback are added here automatically -->
