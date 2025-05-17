# Contributing to MCP Java Decompiler

Thank you for considering contributing to this project! Here are some guidelines to help you get started.

## Development Setup

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/mcp-javadc.git
   cd mcp-javadc
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Build the project
   ```bash
   npm run build
   ```

4. Run the development server
   ```bash
   npm run dev
   ```

## Code Structure

- `src/index.ts` - Main entry point
- `src/services/` - Core services
- `src/tools/` - MCP tool implementations
- `src/types/` - TypeScript type definitions

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## Code Guidelines

- Follow the existing code style
- Write clear commit messages
- Add documentation for new features
- Make sure the build passes (`npm run build`)

## License

By contributing, you agree that your contributions will be licensed under the project's license.