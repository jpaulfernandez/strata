# Bug Log

> Format: See CLAUDE.md for bug entry format

## Getting Started

When a bug is discovered during development, log it here immediately with:
- Description
- Steps to reproduce
- Severity (Critical | High | Medium | Low)
- Status (Open | In Progress | Resolved)

---

## BUG-001: Build Warning - JSON Parse Error

- **Date**: 2026-04-09
- **Severity**: Low
- **Status**: Resolved
- **Description**: During `npm run build`, a SyntaxError appears: `"undefined" is not valid JSON` at `Np.on` in the webpack runtime. Build completes successfully despite the warning.
- **Expected behavior**: Build should complete without JSON parsing errors
- **Steps to reproduce**: Run `npm run build`
- **Root cause**: Calling `getCurrentUser()` in the admin layout during static generation caused serialization issues. The auth session isn't available at build time.
- **Fix applied**: Removed auth calls from admin layout. Settings pages now use client components with `useEffect` to load data at runtime.