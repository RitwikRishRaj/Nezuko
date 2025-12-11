# Git Ignore Configuration

This document explains the .gitignore configuration for the AlgoGym backend microservices.

## 🔒 Security & Sensitive Data

### Environment Variables
```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```
**Why**: Contains sensitive data like API keys, database credentials, and secrets.

### Certificates & Keys
```
*.pem
*.key
*.crt
*.csr
```
**Why**: SSL certificates and private keys should never be committed.

### Secrets
```
secrets/
private/
*.secret
```
**Why**: Any files containing sensitive configuration or credentials.

## 📦 Dependencies & Build Artifacts

### Node.js Dependencies
```
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```
**Why**: Dependencies should be installed via package.json, not committed.

### Build Outputs
```
build/
dist/
out/
```
**Why**: Generated files should be built during deployment, not stored in git.

### Cache Files
```
.cache/
.parcel-cache/
.npm
.eslintcache
```
**Why**: Cache files are temporary and machine-specific.

## 🧪 Testing & Coverage

### Test Artifacts
```
coverage/
*.lcov
.nyc_output/
junit.xml
```
**Why**: Test results and coverage reports are generated during CI/CD.

## 🔧 Development Tools

### IDE Configuration
```
.vscode/
.idea/
*.swp
*.swo
```
**Why**: IDE settings are personal preferences and shouldn't be shared.

### OS Files
```
.DS_Store
Thumbs.db
```
**Why**: Operating system generated files are not relevant to the project.

## 🐳 Docker & Deployment

### Docker Ignore
```
.dockerignore
docker-compose.override.yml
```
**Why**: Local Docker configurations may contain sensitive data.

### Runtime Data
```
pids/
*.pid
*.seed
*.pid.lock
```
**Why**: Process IDs and runtime data are machine-specific.

## 📊 Monitoring & Logs

### Log Files
```
logs/
*.log
*.log.*
```
**Why**: Log files can contain sensitive information and grow large.

### Monitoring Data
```
monitoring/
.pm2/
```
**Why**: Monitoring data is environment-specific.

## 🗄️ Database & Storage

### Local Databases
```
*.sqlite
*.sqlite3
*.db
```
**Why**: Local database files may contain test data or credentials.

### Data Directories
```
docker-data/
postgres-data/
redis-data/
```
**Why**: Persistent data volumes are environment-specific.

## 📁 Service-Specific Patterns

### API Gateway
- Configuration overrides
- SSL certificates
- Access logs

### Room Service
- Temporary room data
- Session files
- Game state cache

### User Service
- User data exports
- Profile images cache
- Authentication tokens

### Question Service
- Downloaded problem sets
- Question cache files
- Test datasets

### Verify Service
- Verification cache
- Submission data
- API response cache

## ✅ What Should Be Committed

### Configuration Templates
```
.env.example
.env.template
```
**Why**: Templates help other developers set up their environment.

### Documentation
```
README.md
SETUP.md
API.md
```
**Why**: Documentation helps team members understand the project.

### Source Code
```
src/
lib/
controllers/
routes/
middleware/
```
**Why**: The actual application code that defines functionality.

### Configuration Files
```
package.json
package-lock.json
Dockerfile
docker-compose.yml
```
**Why**: Defines dependencies, build process, and deployment configuration.

### Tests
```
test/
tests/
__tests__/
*.test.js
*.spec.js
```
**Why**: Tests ensure code quality and prevent regressions.

## 🚨 Security Best Practices

### Never Commit
1. **API Keys**: Supabase keys, Clerk secrets, third-party API keys
2. **Database Credentials**: Connection strings, passwords, tokens
3. **SSL Certificates**: Private keys, certificate files
4. **User Data**: Personal information, test user accounts
5. **Production Configs**: Environment-specific settings

### Use Environment Variables
```bash
# Good
DATABASE_URL=${DATABASE_URL}

# Bad (hardcoded)
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

### Use .env.example
```bash
# .env.example
DATABASE_URL=your_database_url_here
API_KEY=your_api_key_here
SECRET_KEY=your_secret_key_here
```

## 🔍 Checking What's Ignored

### View ignored files
```bash
git status --ignored
```

### Check if file is ignored
```bash
git check-ignore -v filename
```

### Force add ignored file (if needed)
```bash
git add -f filename
```

## 📋 Maintenance

### Regular Review
- Review .gitignore files quarterly
- Remove patterns for deprecated tools
- Add patterns for new tools/frameworks

### Team Sync
- Ensure all team members have updated .gitignore
- Document any project-specific ignore patterns
- Share .env.example templates

### CI/CD Integration
- Validate that no sensitive files are committed
- Use tools like `git-secrets` or `truffleHog`
- Set up pre-commit hooks for sensitive data detection

## 🛠️ Tools & Utilities

### Git Secrets Detection
```bash
# Install git-secrets
npm install -g git-secrets

# Scan for secrets
git secrets --scan
```

### Pre-commit Hooks
```bash
# Install pre-commit
npm install -g pre-commit

# Add to package.json
"pre-commit": ["lint", "test", "check-secrets"]
```

### Environment Validation
```bash
# Check required environment variables
node scripts/check-env.js
```

This comprehensive .gitignore setup ensures that sensitive data stays secure while maintaining a clean repository with only the necessary files committed.