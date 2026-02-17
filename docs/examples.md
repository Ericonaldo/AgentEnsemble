# Examples

Real-world usage examples for AgentEnsemble.

## Code Review

Get multiple perspectives on code quality.

```bash
ae --cost-mode quality
```

```
/ae:ensemble Review src/api/auth.js for:
- Security vulnerabilities
- Performance issues
- Code style problems
```

## Architecture Decisions

Compare different architectural approaches.

```bash
ae
```

```
/ae:ensemble Should we use:
1. REST API with Express
2. GraphQL with Apollo
3. tRPC

Consider our team's experience and project requirements.
```

## Bug Investigation

Multiple agents investigate independently.

```bash
ae --debug
```

```
/ae:ensemble Users report that login fails intermittently.
- Check src/auth/ for issues
- Look at error logs pattern
- Suggest debugging steps
```

## Documentation Writing

Get comprehensive documentation.

```bash
ae --cost-mode balanced
```

```
/ae:ensemble Write API documentation for src/routes/users.js
Include:
- Endpoint descriptions
- Request/response examples
- Error codes
```

## Comparing Agent Approaches

See how each agent would solve a problem.

```bash
ae --synthesis-provider none
```

```
/ae:ensemble How would you refactor this function to be more maintainable?

function processData(data) {
  // ... complex function
}
```

This shows raw responses without synthesis, letting you compare approaches.

## Security Audit

Thorough security review with multiple perspectives.

```bash
ae --cost-mode quality
```

```
/ae:ensemble Perform a security audit on this Express app.
Focus on:
- OWASP Top 10 vulnerabilities
- Authentication/authorization
- Input validation
- Dependency vulnerabilities
```

## Performance Optimization

Get optimization suggestions.

```bash
ae
```

```
/ae:ensemble This API endpoint is slow (500ms average).
Analyze src/api/search.js and suggest optimizations.
```

## Learning a New Codebase

Understand unfamiliar code quickly.

```bash
ae --cost-mode cheap  # Quick answers
```

```
/ae:ensemble Explain the overall architecture of this codebase.
What are the main components and how do they interact?
```

## Testing Strategy

Get testing recommendations.

```bash
ae
```

```
/ae:ensemble Suggest a testing strategy for src/services/payment.js
Include:
- Unit tests needed
- Integration test scenarios
- Edge cases to cover
```

## Workflow Example: Complete Feature Development

### 1. Understand Requirements
```bash
ae --cost-mode cheap
```
```
/ae:ensemble What would be involved in adding user profile pictures?
```

### 2. Plan Architecture
```bash
ae --cost-mode quality
```
```
/ae:ensemble Design the architecture for user profile pictures.
Consider: storage, API endpoints, frontend components
```

### 3. Review Implementation
```bash
ae --cost-mode balanced
```
```
/ae:ensemble Review my implementation of profile pictures in:
- src/api/profile.js
- src/services/storage.js
- src/components/Avatar.jsx
```

### 4. Final Security Check
```bash
ae --cost-mode quality
```
```
/ae:ensemble Security review the profile picture feature.
Check for: file upload vulnerabilities, access control, SSRF
```

## Tips for Better Results

### Be Specific

```
# Less effective
/ae:ensemble Review the code

# More effective
/ae:ensemble Review src/api/auth.js for SQL injection vulnerabilities
```

### Provide Context

```
# Less effective
/ae:ensemble How should I implement this?

# More effective
/ae:ensemble How should I implement user authentication?
We're using Express, PostgreSQL, and need to support OAuth.
```

### Ask for Specific Outputs

```
/ae:ensemble Suggest 5 specific improvements for src/utils/helpers.js
For each: explain the problem, show the fix, explain why it's better
```
