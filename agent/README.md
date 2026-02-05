# Postduck Agent

A lightweight local agent that enables Postduck to make requests to `localhost` URLs from the web app at [postduck.org](https://postduck.org).

## Table of Contents

- [Why Postduck Agent?](#why-postduck-agent)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Publishing](#publishing)

## Why Postduck Agent?

When using postduck.org, requests to `localhost` URLs fail because the server-side proxy runs on the production server, not your local machine. The Postduck Agent solves this by:

- Running locally on your computer
- Proxying `localhost` requests from the web app to your local APIs
- Enabling seamless testing of local development servers from the browser

**Example:** You're developing a REST API on `localhost:3002` and want to test it using postduck.org. Without the agent, requests fail. With the agent running, requests work seamlessly!

## Installation

### Option 1: Using npx (Recommended - No Installation Required)

The easiest way to run the agent without installing anything:

```bash
npx postduck-agent
```

This downloads and runs the latest version automatically. Perfect for quick testing!

### Option 2: Install Globally via npm

For regular use, install globally:

```bash
npm install -g postduck-agent
```

Then run it from anywhere:

```bash
postduck-agent
```

**Updating:** Run `npm install -g postduck-agent@latest` to update to the latest version.

### Option 3: Download Pre-built Binary

Download a standalone binary for your platform from the [GitHub Releases](https://github.com/yourusername/postduck/releases):

- **macOS**: `postduck-agent-macos` (ARM64 or x64)
- **Linux**: `postduck-agent-linux` (x64)
- **Windows**: `postduck-agent-win.exe` (x64)

After downloading:

**macOS/Linux:**

```bash
chmod +x postduck-agent-macos  # or postduck-agent-linux
./postduck-agent-macos
```

**Windows:**

```bash
postduck-agent-win.exe
```

### Option 4: Install via Homebrew (macOS)

```bash
brew install postduck-agent
postduck-agent
```

## Usage

### Basic Usage

Simply start the agent:

```bash
postduck-agent
```

You'll see:

```
🚀 Postduck Agent v0.1.0
   Listening on http://localhost:19199
   Ready to proxy localhost requests!
```

The agent is now running and the Postduck web app will automatically detect it.

### Custom Port

To run on a different port, use the `PORT` environment variable:

```bash
PORT=3000 postduck-agent
```

Or on Windows:

```cmd
set PORT=3000
postduck-agent
```

### Running in Background

**macOS/Linux:**

Using `nohup`:

```bash
nohup postduck-agent > agent.log 2>&1 &
```

Using `screen`:

```bash
screen -S postduck-agent
postduck-agent
# Press Ctrl+A then D to detach
```

Using `tmux`:

```bash
tmux new -s postduck-agent
postduck-agent
# Press Ctrl+B then D to detach
```

**Windows:**

Run in a separate Command Prompt window, or use a service manager like NSSM.

### Stopping the Agent

Press `Ctrl+C` in the terminal where it's running, or:

**Find and kill the process:**

**macOS/Linux:**

```bash
# Find the process
lsof -i :19199
# Kill it
kill <PID>
```

**Windows:**

```cmd
# Find the process
netstat -ano | findstr :19199
# Kill it
taskkill /PID <PID> /F
```

## Configuration

### Environment Variables

| Variable | Default | Description               |
| -------- | ------- | ------------------------- |
| `PORT`   | `19199` | Port the agent listens on |

### CORS Configuration

The agent automatically allows requests from:

- `*.postduck.org`
- `localhost` (all ports)
- `127.0.0.1` (all ports)

No configuration needed - it works out of the box!

## Troubleshooting

### Agent Not Detected by Web App

**Problem:** The web app shows "Agent Not Connected" even though the agent is running.

**Solutions:**

1. **Check if agent is running:**

   ```bash
   curl http://localhost:19199/health
   ```

   Should return: `{"status":"ok","version":"0.1.0"}`

2. **Check port conflicts:**

   ```bash
   # macOS/Linux
   lsof -i :19199

   # Windows
   netstat -ano | findstr :19199
   ```

   If another process is using port 19199, either stop it or use a different port.

3. **Try a different port:**

   ```bash
   PORT=3000 postduck-agent
   ```

   Note: The web app currently only checks port 19199. If you use a custom port, you'll need to update the web app configuration.

4. **Check firewall settings:** Ensure your firewall allows connections on port 19199.

### Connection Refused Errors

**Problem:** Requests fail with "Connection refused" errors.

**Solutions:**

1. Ensure the agent is running
2. Check that your local API server is running on the expected port
3. Verify the URL in Postduck matches your local server (e.g., `http://localhost:3002/api/users`)

### CORS Errors

**Problem:** Browser console shows CORS errors.

**Solutions:**

1. Ensure you're accessing postduck.org (not a localhost version)
2. Check that the agent is running and accessible
3. Verify the agent version is up to date

### Port Already in Use

**Problem:** Agent fails to start because port 19199 is already in use.

**Solutions:**

1. **Find and stop the conflicting process:**

   ```bash
   # macOS/Linux
   lsof -i :19199
   kill <PID>

   # Windows
   netstat -ano | findstr :19199
   taskkill /PID <PID> /F
   ```

2. **Use a different port:**
   ```bash
   PORT=3000 postduck-agent
   ```

### Agent Crashes or Stops Unexpectedly

**Problem:** Agent stops running without warning.

**Solutions:**

1. Check the terminal output for error messages
2. Ensure you have sufficient system resources
3. Try updating to the latest version: `npm install -g postduck-agent@latest`
4. Report the issue on [GitHub Issues](https://github.com/yourusername/postduck/issues) with:
   - Your operating system and version
   - Node.js version (if using npm version)
   - Error messages or logs

## Development

### Prerequisites

- Node.js 18+ (for development)
- npm or yarn
- TypeScript 5+

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/postduck.git
   cd postduck/agent
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the project:

   ```bash
   npm run build
   ```

4. Run in development mode:
   ```bash
   npm run dev
   ```
   This uses `tsx` for hot-reloading during development.

### Project Structure

```
agent/
├── src/
│   ├── index.ts      # Main server entry point
│   ├── proxy.ts      # Request proxying logic
│   └── types.ts      # TypeScript type definitions
├── dist/             # Compiled JavaScript (generated)
├── package.json      # Package configuration
├── tsconfig.json     # TypeScript configuration
└── README.md         # This file
```

### Building Binaries

To create standalone executables for all platforms:

```bash
npm run package
```

This uses `pkg` to create binaries in `dist/bin/`:

- `postduck-agent-macos-arm64`
- `postduck-agent-macos-x64`
- `postduck-agent-linux-x64`
- `postduck-agent-win-x64.exe`

**Note:** Building binaries requires the `pkg` package and may take several minutes.

### Testing

Currently, testing is manual. To test:

1. Start the agent: `npm run dev`
2. In another terminal, test the health endpoint:
   ```bash
   curl http://localhost:19199/health
   ```
3. Test the proxy endpoint with a sample request (see API section below)

### API Endpoints

#### `GET /health`

Health check endpoint. Returns agent status and version.

**Response:**

```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

#### `POST /proxy`

Proxies a request to the target URL. Accepts the same payload format as the Postduck web app's `/api/proxy` endpoint.

**Request Body:**

```json
{
  "method": "GET",
  "url": "http://localhost:3002/api/users",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "type": "json",
    "content": "{\"key\":\"value\"}"
  },
  "authType": "none",
  "authConfig": {}
}
```

**Response:**

```json
{
  "statusCode": 200,
  "headers": {
    "content-type": "application/json"
  },
  "body": "{\"users\":[...]}",
  "duration": 45,
  "size": 1024,
  "cookies": []
}
```

## Publishing

### Prerequisites for Publishing

- npm account with access to the `postduck-agent` package
- GitHub account with access to the repository
- Node.js 18+ installed

### Publishing to npm

1. **Update version** in `package.json`:

   ```json
   {
     "version": "0.1.1" // Use semantic versioning
   }
   ```

2. **Build the project:**

   ```bash
   npm run build
   ```

3. **Test locally:**

   ```bash
   npm start
   ```

4. **Publish to npm:**

   ```bash
   npm publish
   ```

   For the first publish, you may need to:

   ```bash
   npm login
   npm publish --access public
   ```

5. **Verify publication:**
   ```bash
   npm view postduck-agent
   ```

### Creating GitHub Releases

1. **Build binaries for all platforms:**

   ```bash
   npm run package
   ```

2. **Create a new release on GitHub:**

   - Go to https://github.com/yourusername/postduck/releases/new
   - Tag version: `v0.1.1` (must match package.json version)
   - Release title: `Postduck Agent v0.1.1`
   - Description: Include changelog and installation instructions

3. **Upload binaries:**

   - Upload all files from `dist/bin/`:
     - `postduck-agent-macos-arm64`
     - `postduck-agent-macos-x64`
     - `postduck-agent-linux-x64`
     - `postduck-agent-win-x64.exe`

4. **Publish the release**

### Versioning Strategy

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible

### Release Checklist

- [ ] Update version in `package.json`
- [ ] Update CHANGELOG.md (if maintained)
- [ ] Build and test locally
- [ ] Run `npm run package` to create binaries
- [ ] Publish to npm: `npm publish`
- [ ] Create GitHub release with binaries
- [ ] Update main README.md if needed
- [ ] Announce on social media / blog (optional)

### Homebrew Formula (macOS)

To add Homebrew support:

1. Create a formula file (see Homebrew documentation)
2. Submit to Homebrew core or create a custom tap
3. Update installation instructions in this README

Example formula structure:

```ruby
class PostduckAgent < Formula
  desc "Local agent for Postduck to enable localhost requests"
  homepage "https://postduck.org"
  url "https://github.com/yourusername/postduck/releases/download/v0.1.0/postduck-agent-macos-x64"
  sha256 "..."

  def install
    bin.install "postduck-agent-macos-x64" => "postduck-agent"
  end
end
```

## License

MIT License - see LICENSE file in the main repository.

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/postduck/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/postduck/discussions)
- **Documentation**: [Postduck Docs](https://postduck.org/docs)

## Contributing

Contributions are welcome! Please see the main repository's CONTRIBUTING.md for guidelines.

---

**Made with ❤️ for the Postduck community**
