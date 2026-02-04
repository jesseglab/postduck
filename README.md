# Postduck - API Request Manager

A full-featured API request manager built with Next.js, featuring local-first storage with optional cloud sync.

## Features

- **Local-First Storage**: All data stored locally in IndexedDB - works offline, no login required
- **Request Management**: Create, organize, and execute HTTP requests (GET, POST, PUT, PATCH, DELETE, etc.)
- **Collections & Folders**: Organize requests into collections with nested folders
- **Environment Variables**: Use `{{variable}}` syntax for dynamic values
- **Authentication Helpers**: Bearer tokens, Basic Auth, and API Key support
- **Request History**: Track all executed requests with response details
- **cURL Import/Export**: Import curl commands or export requests as curl
- **Beautiful UI**: Built with shadcn/ui and Tailwind CSS
- **Cloud Sync** (Optional): Login to sync your requests across devices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Local Storage**: Dexie.js (IndexedDB)
- **Backend**: Next.js API Routes
- **Database**: MySQL with Prisma ORM
- **Authentication**: better-auth
- **Code Editor**: Monaco Editor

## Getting Started

### Prerequisites

- **Node.js 20.19+, 22.12+, or 24.0+** (required for Prisma)
  - ⚠️ **Important**: Node.js v21.x is NOT supported by Prisma
  - Check your version: `node --version`
  - If you're on v21.x, you need to upgrade to v20.19+, v22.12+, or v24.0+
  - Recommended: Use [nvm](https://github.com/nvm-sh/nvm) to manage Node versions:
    ```bash
    nvm install 22
    nvm use 22
    ```
- MySQL database
- npm or yarn

### Installation

1. **Ensure you have the correct Node.js version** (see Prerequisites above)

2. Clone the repository:

```bash
git clone <your-repo-url>
cd postman
```

3. Install dependencies:

```bash
npm install
```

4. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env.local` and add your database URL:

```
DATABASE_URL="mysql://user:password@localhost:3306/postduck"
BETTER_AUTH_SECRET="your-secret-key-here-change-in-production"
BETTER_AUTH_URL="http://localhost:3000"
```

5. Set up the database:

```bash
npx prisma generate
npx prisma db push
```

6. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Local Mode (No Login Required)

The app works completely offline with local storage:

1. Create collections to organize your requests
2. Add requests with URL, method, headers, body, and auth
3. Use environment variables with `{{variableName}}` syntax
4. Execute requests and view responses
5. All data is stored locally in your browser

### Cloud Sync (Optional)

1. Click "Login / Register" in the sidebar
2. Create an account or login
3. Use "Sync to Cloud" to upload your local data
4. Use "Sync from Cloud" to download data from another device

## Project Structure

```
postduck/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth pages (login/register)
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── proxy/         # Request proxy
│   │   └── sync/          # Sync endpoints
│   └── page.tsx           # Main app page
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── sidebar/           # Sidebar components
│   ├── request-panel/    # Request builder components
│   ├── response-panel/    # Response viewer components
│   └── modals/            # Modal dialogs
├── lib/                   # Utility libraries
│   ├── db/               # Database clients (local & Prisma)
│   ├── auth.ts           # Authentication config
│   ├── sync.ts           # Sync engine
│   ├── curl-parser.ts    # cURL import/export
│   └── variable-interpolation.ts
├── hooks/                 # React hooks
├── types/                 # TypeScript types
└── prisma/               # Prisma schema
```

## Development

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Or create migrations
npx prisma migrate dev
```

## Features in Detail

### Request Builder

- **URL Bar**: Enter URLs with environment variable interpolation
- **Method Selector**: Choose HTTP method (GET, POST, PUT, etc.)
- **Headers Editor**: Add custom headers with key-value pairs
- **Body Editor**:
  - JSON editor with syntax highlighting
  - Form-data editor
  - Raw text editor
- **Auth Config**: Configure Bearer tokens, Basic Auth, or API Keys

### Response Viewer

- **Body Tab**: View formatted JSON, HTML preview, or raw response
- **Headers Tab**: See all response headers
- **Timing Tab**: Request duration information

### Collections

- Create collections and nested folders
- Drag and drop to reorganize (coming soon)
- Import/export cURL commands

### Environment Variables

- Create multiple environments (Production, Development, etc.)
- Define variables with `{{key}}` syntax
- Secret variables are masked in the UI
- Variables are interpolated in URLs, headers, and body

## License

PolyForm Noncommercial 1.0.0 (see `LICENSE`).

Commercial / monetised use is not permitted.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
