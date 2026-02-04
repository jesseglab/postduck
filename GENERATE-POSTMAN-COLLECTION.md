# Generate Postman Collection from Backend Codebase

## Purpose

This skill instructs an AI agent to analyze any backend codebase, identify all API endpoints, and generate a complete Postman Collection v2.1.0 JSON file with proper structure, environment variables, and importable format.

## When to Use

Use this skill when:

- You need to create a Postman collection from an existing backend API
- You want to document all API endpoints in a testable format
- You need to share API endpoints with team members or clients
- You want to set up automated API testing

## Expected Output

Generate two JSON files:

1. `{project-name}-collection.json` - Complete Postman Collection v2.1.0
2. `{project-name}-environment.json` - Environment variables (optional but recommended)

Both files should be importable directly into Postman desktop app or web platform.

---

## Step 1: Analyze Backend Codebase

### Framework Detection

Identify the backend framework and API structure by examining:

1. **Package.json / Requirements files**

   - Look for framework dependencies (Express, FastAPI, Django, Next.js, etc.)
   - Check for routing libraries

2. **Directory Structure**

   - Common API route locations:
     - Next.js App Router: `app/api/**/route.ts` or `pages/api/**`
     - Express.js: `routes/`, `controllers/`, or inline in `app.js`/`server.js`
     - FastAPI: `routers/`, `api/`, or main `app.py`
     - Django: `urls.py` files, `views.py` with `@api_view` decorators
     - Go: `handlers/`, `routes/`, or inline route definitions
     - NestJS: `controllers/` with `@Controller()` decorators
     - Rails: `routes.rb` and `controllers/`

3. **Route Definitions**
   - Search for HTTP method patterns:
     - `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`
     - Framework-specific decorators (`@app.get()`, `@router.post()`, etc.)
     - Route handler functions

### Endpoint Discovery Process

For each framework, follow these patterns:

#### Next.js App Router

```typescript
// app/api/users/route.ts
export async function GET(request: Request) { ... }
export async function POST(request: Request) { ... }

// app/api/users/[id]/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) { ... }
```

- Path: `/api/users` → GET, POST
- Path: `/api/users/[id]` → GET, PUT, DELETE (check exports)
- Dynamic segments: `[id]`, `[...slug]` become `:id`, `*` in URLs

#### Express.js

```javascript
app.get("/api/users", handler);
app.post("/api/users", handler);
router.get("/:id", handler);
```

- Extract base path from `app.use('/api', router)`
- Combine router prefix with route paths
- Check for middleware that adds prefixes

#### FastAPI

```python
@app.get("/users")
@app.post("/users")
@router.get("/{user_id}")
```

- Check `app.include_router()` for prefixes
- Extract path parameters from `{param}` syntax
- Check `@app.api_route()` for multiple methods

#### Django REST Framework

```python
@api_view(['GET', 'POST'])
def user_list(request):
    pass

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
```

- Check `urls.py` for URL patterns
- Extract from ViewSets (auto-generates CRUD endpoints)
- Check `@api_view` decorators for methods

#### Go (Chi, Gin, Echo)

```go
r.Get("/users", handler)
r.Post("/users", handler)
r.Get("/users/{id}", handler)
```

- Extract route groups and prefixes
- Path parameters: `{id}` or `:id` syntax
- Check middleware for base paths

### Extract Endpoint Information

For each endpoint discovered, extract:

1. **HTTP Method**: GET, POST, PUT, PATCH, DELETE, etc.
2. **Path**: Full route path (e.g., `/api/users/:id`)
3. **Path Parameters**: Variables in URL (e.g., `:id`, `:userId`)
4. **Query Parameters**: Check for `req.query`, `request.query_params`, etc.
5. **Request Body Schema**:
   - TypeScript interfaces/types
   - Zod schemas
   - Pydantic models
   - JSDoc comments
   - Example values in tests
6. **Response Schema**: Return types, response models
7. **Headers**: Content-Type, custom headers, authentication requirements
8. **Authentication**:
   - Bearer tokens (JWT)
   - API keys
   - Basic auth
   - OAuth patterns
   - Session-based

---

## Step 2: Organize Endpoints into Folders

### Folder Structure Rules

1. **Group by Resource/Domain**

   - `/api/users/*` → "Users" folder
   - `/api/auth/*` → "Authentication" folder
   - `/api/products/*` → "Products" folder

2. **Nested Folders for Sub-resources**

   - `/api/users/:id/posts` → "Users" > "User Posts"
   - `/api/products/:id/reviews` → "Products" > "Product Reviews"

3. **Group by Feature**

   - If endpoints are feature-based rather than resource-based:
     - "User Management"
     - "Order Processing"
     - "Analytics"

4. **Special Folders**

   - "Health & Status" for `/health`, `/status`, `/ping`
   - "Admin" for admin-only endpoints
   - "Public" vs "Protected" if clear separation

5. **Ordering**
   - Alphabetical within folders
   - CRUD operations: GET (list) → GET (single) → POST → PUT → PATCH → DELETE
   - Most common endpoints first

### Folder Naming Convention

- Use PascalCase or Title Case: "User Management", "Product Catalog"
- Be descriptive but concise
- Avoid generic names like "API" or "Endpoints"

---

## Step 3: Generate Postman Collection JSON

### Collection Schema (v2.1.0)

The collection must follow Postman Collection Format v2.1.0:

```json
{
  "info": {
    "_postman_id": "{{generate-uuid}}",
    "name": "{{Project Name}} API",
    "description": "Auto-generated Postman collection for {{Project Name}}",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    // Folders and requests go here
  ],
  "auth": {
    // Collection-level auth (optional, inherited by all requests)
  },
  "variable": [
    // Collection-level variables
  ],
  "event": [
    {
      "listen": "prerequest",
      "script": {
        "type": "text/javascript",
        "exec": [""]
      }
    },
    {
      "listen": "test",
      "script": {
        "type": "text/javascript",
        "exec": [""]
      }
    }
  ]
}
```

### Request Item Structure

Each request in the collection:

```json
{
  "name": "Get User by ID",
  "request": {
    "method": "GET",
    "header": [
      {
        "key": "Content-Type",
        "value": "application/json",
        "type": "text"
      }
    ],
    "url": {
      "raw": "{{base_url}}/api/users/:id",
      "host": ["{{base_url}}"],
      "path": ["api", "users", ":id"],
      "variable": [
        {
          "key": "id",
          "value": "1",
          "description": "User ID"
        }
      ]
    },
    "body": {
      // Only for POST, PUT, PATCH
    },
    "auth": {
      // Request-specific auth (optional, inherits from collection)
    },
    "description": "Retrieve a specific user by their ID"
  },
  "response": []
}
```

### Folder Item Structure

Folders contain nested `item` arrays:

```json
{
  "name": "Users",
  "item": [
    {
      "name": "List Users",
      "request": { ... }
    },
    {
      "name": "Get User",
      "request": { ... }
    }
  ],
  "description": "User management endpoints"
}
```

### URL Construction

1. **Base URL**: Always use `{{base_url}}` variable
2. **Path Segments**: Split into array: `["api", "users", ":id"]`
3. **Path Variables**: Use `:variable` syntax, add to `variable` array
4. **Query Parameters**: Add to `query` array:
   ```json
   "query": [
     {
       "key": "page",
       "value": "1",
       "description": "Page number"
     },
     {
       "key": "limit",
       "value": "10",
       "description": "Items per page"
     }
   ]
   ```

### Request Body Format

#### JSON Body (most common)

```json
"body": {
  "mode": "raw",
  "raw": "{\n  \"name\": \"John Doe\",\n  \"email\": \"john@example.com\"\n}",
  "options": {
    "raw": {
      "language": "json"
    }
  }
}
```

#### Form Data

```json
"body": {
  "mode": "formdata",
  "formdata": [
    {
      "key": "name",
      "value": "John Doe",
      "type": "text"
    },
    {
      "key": "email",
      "value": "john@example.com",
      "type": "text"
    }
  ]
}
```

#### URL Encoded

```json
"body": {
  "mode": "urlencoded",
  "urlencoded": [
    {
      "key": "name",
      "value": "John Doe"
    }
  ]
}
```

### Authentication Configuration

#### Bearer Token

```json
"auth": {
  "type": "bearer",
  "bearer": [
    {
      "key": "token",
      "value": "{{bearer_token}}",
      "type": "string"
    }
  ]
}
```

#### API Key

```json
"auth": {
  "type": "apikey",
  "apikey": [
    {
      "key": "value",
      "value": "{{api_key}}",
      "type": "string"
    },
    {
      "key": "key",
      "value": "X-API-Key",
      "type": "string"
    },
    {
      "key": "in",
      "value": "header",
      "type": "string"
    }
  ]
}
```

#### Basic Auth

```json
"auth": {
  "type": "basic",
  "basic": [
    {
      "key": "username",
      "value": "{{username}}",
      "type": "string"
    },
    {
      "key": "password",
      "value": "{{password}}",
      "type": "string"
    }
  ]
}
```

### Generate Example Values

For request bodies, generate sensible examples:

1. **From TypeScript/Zod Schemas**:

   ```typescript
   interface CreateUser {
     name: string;
     email: string;
     age?: number;
   }
   ```

   → `{ "name": "John Doe", "email": "john@example.com", "age": 30 }`

2. **From Pydantic Models**:

   ```python
   class UserCreate(BaseModel):
       name: str
       email: EmailStr
   ```

   → `{ "name": "John Doe", "email": "user@example.com" }`

3. **From JSDoc/Comments**:

   ```javascript
   /**
    * @param {Object} data - User data
    * @param {string} data.name - User's full name
    * @param {string} data.email - Valid email address
    */
   ```

   → Extract field descriptions and types

4. **Default Examples**:
   - `string` → `"example"`
   - `number` → `0` or `1`
   - `boolean` → `true`
   - `email` → `"user@example.com"`
   - `date` → `"2025-01-01"`
   - `uuid` → `"123e4567-e89b-12d3-a456-426614174000"`

---

## Step 4: Generate Environment Variables

### Environment JSON Format

Create a separate environment file:

```json
{
  "id": "{{generate-uuid}}",
  "name": "{{Project Name}} - Local",
  "values": [
    {
      "key": "base_url",
      "value": "http://localhost:3000",
      "enabled": true,
      "type": "default"
    },
    {
      "key": "api_key",
      "value": "",
      "enabled": true,
      "type": "secret"
    },
    {
      "key": "bearer_token",
      "value": "",
      "enabled": true,
      "type": "secret"
    }
  ],
  "_postman_variable_scope": "environment"
}
```

### Extract Environment Variables

1. **From .env files**:

   - `.env`, `.env.local`, `.env.example`
   - Common patterns: `API_URL`, `BASE_URL`, `DATABASE_URL`
   - Extract API-related variables only

2. **From Configuration Files**:

   - `config.js`, `settings.py`, `config.yaml`
   - Look for API endpoints, ports, API keys

3. **Common Variables to Include**:

   - `base_url` / `api_url` - Base API URL
   - `api_key` - API key if used
   - `bearer_token` - JWT token placeholder
   - `username` / `password` - If basic auth is used
   - Environment-specific: `dev_url`, `staging_url`, `prod_url`

4. **Variable Naming**:
   - Use snake_case: `base_url`, `api_key`
   - Be descriptive: `auth_token` not `token`
   - Use `{{variable}}` syntax in collection URLs

### Multiple Environments

Generate multiple environment files if different configs exist:

- `{project}-local.json` - Local development
- `{project}-staging.json` - Staging environment
- `{project}-production.json` - Production (with empty secrets)

---

## Step 5: Add Descriptions and Documentation

### Collection Description

Add to `info.description`:

- Project name and purpose
- API version if available
- Base URL information
- Authentication requirements
- Important notes or limitations

### Request Descriptions

For each request, add:

- What the endpoint does
- Required vs optional parameters
- Example use cases
- Response format notes

```json
"description": "Retrieve a list of all users. Supports pagination via query parameters.\n\n**Query Parameters:**\n- `page` (optional): Page number (default: 1)\n- `limit` (optional): Items per page (default: 10)\n\n**Response:** Returns array of user objects with pagination metadata."
```

### Parameter Descriptions

Add descriptions to path variables and query parameters:

```json
"variable": [
  {
    "key": "id",
    "value": "1",
    "description": "Unique identifier for the user"
  }
]
```

---

## Step 6: Validation and Quality Checks

Before finalizing, ensure:

1. **Valid JSON**: All JSON is properly formatted and parseable
2. **Schema Compliance**: Follows Postman v2.1.0 schema
3. **Variable Usage**: All `{{variables}}` are defined in environment
4. **URL Format**: URLs use proper path segments and variables
5. **Method Accuracy**: HTTP methods match actual endpoint handlers
6. **Body Format**: Request bodies match Content-Type headers
7. **Auth Consistency**: Authentication matches backend requirements
8. **No Duplicates**: No duplicate endpoints or folders
9. **Naming**: Clear, descriptive names for folders and requests
10. **Examples**: All POST/PUT/PATCH requests have example bodies

---

## Step 7: Output Files

### Collection File

Save as: `{project-name}-collection.json`

Example: `my-api-collection.json`

### Environment File(s)

Save as: `{project-name}-{environment}-environment.json`

Examples:

- `my-api-local-environment.json`
- `my-api-staging-environment.json`
- `my-api-production-environment.json`

### File Location

Save files in the project root or a `postman/` directory.

---

## Step 8: Import Instructions

Include these instructions in a comment or separate README:

### Importing into Postman

1. **Open Postman**

   - Desktop app or web platform (https://web.postman.co)

2. **Import Collection**

   - Click "Import" button (top left)
   - Select "Upload Files"
   - Choose `{project-name}-collection.json`
   - Click "Import"

3. **Import Environment**

   - Click "Import" again
   - Select `{project-name}-{environment}-environment.json`
   - Click "Import"

4. **Set Active Environment**

   - Click environment dropdown (top right)
   - Select the imported environment
   - Verify variables are loaded

5. **Update Variables**

   - Go to Environments sidebar
   - Edit environment variables
   - Add actual values for secrets (API keys, tokens)
   - Save changes

6. **Test Requests**
   - Select a request from collection
   - Verify URL resolves correctly with `{{base_url}}`
   - Update any placeholder values
   - Click "Send" to test

### Troubleshooting

- **Variables not resolving**: Check environment is active and variables are defined
- **404 errors**: Verify `base_url` matches your server
- **Auth errors**: Update authentication tokens/keys in environment
- **Invalid JSON**: Validate JSON syntax before importing

---

## Example: Complete Collection Structure

```json
{
  "info": {
    "_postman_id": "abc123-def456-ghi789",
    "name": "My API Collection",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"user@example.com\",\n  \"password\": \"password123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/api/auth/login",
              "host": ["{{base_url}}"],
              "path": ["api", "auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Users",
      "item": [
        {
          "name": "List Users",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/api/users?page=1&limit=10",
              "host": ["{{base_url}}"],
              "path": ["api", "users"],
              "query": [
                {
                  "key": "page",
                  "value": "1"
                },
                {
                  "key": "limit",
                  "value": "10"
                }
              ]
            },
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{bearer_token}}"
                }
              ]
            }
          }
        },
        {
          "name": "Get User",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/api/users/:id",
              "host": ["{{base_url}}"],
              "path": ["api", "users", ":id"],
              "variable": [
                {
                  "key": "id",
                  "value": "1"
                }
              ]
            },
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{bearer_token}}"
                }
              ]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    }
  ]
}
```

---

## Summary Checklist

When generating a Postman collection, ensure you:

- [ ] Analyzed all API routes in the codebase
- [ ] Identified HTTP methods for each endpoint
- [ ] Extracted request/response schemas
- [ ] Organized endpoints into logical folders
- [ ] Generated proper Postman v2.1.0 JSON structure
- [ ] Added environment variables from .env/config files
- [ ] Created example request bodies with realistic values
- [ ] Configured authentication (Bearer, API Key, etc.)
- [ ] Added descriptions for collections, folders, and requests
- [ ] Validated JSON syntax and schema compliance
- [ ] Generated both collection and environment JSON files
- [ ] Included import instructions

---

## Notes

- Always use `{{base_url}}` variable instead of hardcoded URLs
- Generate UUIDs for `_postman_id` and environment `id` fields
- Keep request names descriptive and consistent
- Use proper HTTP methods (don't use GET for mutations)
- Include Content-Type headers for POST/PUT/PATCH requests
- Mark sensitive variables as `"type": "secret"` in environments
- Test the generated JSON can be imported into Postman before finalizing
