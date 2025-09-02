---
allowed-tools: Bash(npm run:*), Task
description: Run lint and TypeScript checks, then spawn agents to fix all issues iteratively until everything passes
argument-hint: [optional custom instructions]
---

## Context

Run comprehensive code quality checks and fix all issues automatically:

- Current lint status: `npm run lint`
- Build/TypeScript check: `npm run build`

## Your task

You are tasked with ensuring code quality by running lint and TypeScript checks, then automatically fixing all issues found. Follow this iterative process:

1. **Initial Assessment**: Analyze the output from the lint and build commands above
2. **Issue Identification**: Identify all lint errors, warnings, and TypeScript errors
3. **Systematic Fixing**: For each category of issues:
   - Use the Task tool to spawn specialized agents when needed for complex fixes
   - Fix issues directly when they are straightforward
   - Prioritize TypeScript errors first, then ESLint errors, then warnings
4. **Verification Loop**: After making fixes, re-run the checks:
   - Run `npm run lint` to verify linting issues are resolved
   - Run `npm run build` to verify TypeScript issues are resolved
5. **Iterate**: Repeat steps 2-4 until both commands pass without errors
6. **Final Confirmation**: Ensure both `npm run lint` and `npm run build` complete successfully

**Important Guidelines:**
- Never ignore or suppress errors - fix the root cause
- Use Task tool agents for complex refactoring or when multiple files need coordinated changes
- Make incremental progress and verify after each round of fixes
- If custom instructions are provided in $ARGUMENTS, incorporate them into your fixing approach
- Continue iterating until ALL issues are resolved and both commands succeed

**Best Practices & Industry Standards:**
- **TypeScript Excellence**: Add proper type annotations, interfaces, and generics where beneficial
- **Type Safety**: Replace `any` types with specific types, use strict TypeScript patterns
- **Modern React**: Use proper React patterns (hooks, functional components, proper prop typing)
- **Performance**: Implement proper memoization, lazy loading, and optimization patterns where applicable
- **Security**: Follow security best practices, sanitize inputs, avoid XSS vulnerabilities
- **Accessibility**: Ensure proper ARIA labels, semantic HTML, keyboard navigation support
- **Error Handling**: Add proper error boundaries, try-catch blocks, and graceful error handling
- **Code Organization**: Follow consistent naming conventions, proper file structure, and separation of concerns
- **Documentation**: Add JSDoc comments for complex functions and interfaces
- **Testing Readiness**: Structure code to be easily testable with proper dependency injection

Custom instructions (if any): $ARGUMENTS