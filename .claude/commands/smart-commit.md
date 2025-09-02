---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git diff:*), Bash(git log:*), Task
description: Create logical, separate commits by intelligently grouping related files
argument-hint: [optional commit message prefix or custom instructions]
---

## Context

Analyze current repository state and create logical commits:

- Current git status: !`git status --porcelain`
- Recent commit history (for style reference): !`git log --oneline -5`
- Staged changes (if any): !`git diff --cached --name-only`
- Unstaged changes: !`git diff --name-only`

## Your task

Create multiple logical commits by intelligently grouping related files instead of committing everything at once. Follow this systematic approach:

### 1. **Analyze & Categorize Changes**
Group files by logical relationships:
- **Database/Schema**: Prisma migrations, schema changes, database-related files
- **Dependencies**: package.json, package-lock.json, yarn.lock changes
- **Configuration**: Config files, .gitignore, environment files, build configs
- **UI Components**: Component files that work together or represent a single feature
- **API/Backend**: API routes, server-side logic, middleware
- **Types/Utilities**: Type definitions, utility functions, shared libraries
- **Documentation**: README, docs, comments, markdown files
- **Feature-Specific**: Files that belong to the same feature or user story

### 2. **Create Logical Commit Groups**
For each group, determine:
- What files belong together logically
- What the commit represents (feature, fix, refactor, etc.)
- Appropriate commit message following conventional commits format

### 3. **Execute Smart Commits**
For each logical group:
- Add only the files that belong to that specific change
- Create a descriptive commit message that explains the "why" not just the "what"
- Follow conventional commit format: `type(scope): description`
  - Types: feat, fix, refactor, docs, style, test, chore
  - Include breaking change indicators if applicable

### 4. **Commit Message Quality**
Each commit should:
- Be atomic (one logical change per commit)
- Have a clear, descriptive message
- Follow the existing project's commit style
- Explain the purpose and impact of the change
- Reference issues or PRs if applicable

### 5. **Verification**
After each commit:
- Verify the commit was created successfully
- Ensure only intended files were included
- Check the commit message is clear and follows conventions

### **Best Practices:**
- **Atomic Commits**: Each commit should represent one logical unit of work
- **Dependencies First**: Commit dependency changes before code that uses them
- **Database Changes**: Keep schema/migration changes in separate commits
- **Feature Completeness**: Group files that complete a single feature together
- **Avoid Mixed Concerns**: Don't mix refactoring with new features
- **Clear Scope**: Each commit should have a clear, single purpose
- **Reviewability**: Make commits easy to review and understand

### **Commit Message Examples:**
- `feat(admin): add audiobook management dashboard`
- `fix(auth): resolve middleware redirect loop`
- `refactor(components): extract reusable UI components`
- `docs(readme): update setup instructions`
- `chore(deps): update dependencies to latest versions`
- `feat(database): add audiobook schema and migrations`

Custom instructions or prefix: $ARGUMENTS

**Important**: Never use `git add .` or `git add -A` - always add files selectively for each logical commit.