## Summary of Changes

<!-- Provide a brief, clear explanation of what this PR introduces, solves, or refactors. -->

### Related Issue / Phase
- **Roadmap Phase**: Phase <!-- e.g., Phase 1, Phase 2, Phase 4 -->
- **Fixes/Closes**: #<!-- Issue number if applicable -->

---

## Type of Change
- [ ] `feat`: New feature or capability
- [ ] `fix`: Bug fix
- [ ] `ml`: ML model training, feature adapter, or DARI policy updates
- [ ] `test`: New or updated tests
- [ ] `refactor`: Code refactoring without behavior change
- [ ] `infra`: Infrastructure, Docker Compose, or CI/CD
- [ ] `docs`: Documentation or memory updates

---

## DARI & Security Invariant Verification

Please review each invariant that applies to this PR:
- [ ] **Preserves DARI Fingerprint & Ladder ($A0–A3$)**: Does not alter action meanings or allow drift alone to trigger full retraining ($A3$).
- [ ] **Zero Data Leakage**: Features/scalers fit only on training data; temporal splits respected.
- [ ] **Safety Gates are Deterministic**: Statistical checks and non-regression gates are strictly code-evaluated (not bypassed by LLM or heuristics).
- [ ] **No Hardcoded Secrets**: No credentials, tokens, or raw packet data committed.

---

## Testing & Quality Gate Evidence

- [ ] Ran `make check` locally with 0 errors:
  - [ ] Backend Ruff linting (`uv run ruff check .`)
  - [ ] Backend Pytest test suite (`uv run pytest`)
  - [ ] Frontend ESLint (`npm run lint`)
  - [ ] Frontend build (`npm run build`)

**Test Output Snippet:**
```text
<!-- Paste brief summary from make check or pytest, e.g., 13 passed in 0.38s -->
```

---

## Pre-Merge Checklist
- [ ] Living record updated in `memory.md` (Changelog section and Phase Status if applicable).
- [ ] Public functions, APIs, and data contracts are typed.
- [ ] No dead code, debug prints, or commented-out blocks left behind.
- [ ] Commits follow Conventional Commits formatting (`feat:`, `fix:`, `ml:`, etc.).
