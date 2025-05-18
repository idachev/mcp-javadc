# Publishing to npm

This document contains instructions for publishing the MCP Java Decompiler server to npm.

## Prerequisites

1. Create an npm account at https://www.npmjs.com/signup if you don't have one
2. Update the package.json with your name, email, and GitHub repository URL
3. Ensure all tests pass with `npm test`
4. Ensure linting passes with `npm run lint`

## Publishing Process

1. Login to your npm account:
   ```bash
   npm login
   ```

2. For first-time publish with a scoped package:
   ```bash
   npm publish --access public
   ```

   For subsequent updates:
   ```bash
   npm publish
   ```


## Version Updates

When you need to update the package, update the version in package.json following semantic versioning:

- MAJOR: Breaking changes
- MINOR: New features, no breaking changes
- PATCH: Bug fixes, no breaking changes

Example:
```bash
# Update version and publish
npm version patch  # or 'minor' or 'major'
npm publish
```

## Tags and Releases

Consider creating a GitHub release and tag when publishing a new version:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Then create a GitHub release at https://github.com/idachev/mcp-javadc/releases/new

## Testing Your Package Before Publishing

You can use `npm pack` to create a local tarball without publishing:

```bash
npm pack
```

This creates a `.tgz` file you can install locally for testing:

```bash
npm install -g ./idachev-mcp-javadc-1.2.3.tgz
```