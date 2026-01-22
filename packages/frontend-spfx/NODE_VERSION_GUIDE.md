# Node.js Version Compatibility Guide for SPFx

## Current Issue

SPFx 1.11.0-plusbeta has several compatibility issues with Node.js versions above 14:

1. **node-sass** - Does not support Node.js 15+
2. **gulp 3.x** - Has `primordials` error with Node.js 12+
3. **graceful-fs@3.x** - Not compatible with Node.js 12+

## Recommended Solutions

### Option 1: Use Node.js 14 LTS (RECOMMENDED)

Install Node.js 14.x which is fully compatible with SPFx 1.11.0.

#### Using NVM for Windows

```powershell
# Install NVM for Windows from:
# https://github.com/coreybutler/nvm-windows/releases

# Install Node.js 14 LTS
nvm install 14.21.3
nvm use 14.21.3

# Verify
node --version  # Should show v14.21.3
```

#### Using Node Version Manager (fnm) - Faster Alternative

```powershell
# Install fnm via winget
winget install Schniz.fnm

# Add to PowerShell profile
fnm env --use-on-cd | Out-String | Invoke-Expression

# Install Node.js 14
fnm install 14.21.3
fnm use 14.21.3

# Verify
node --version
```

#### Direct Install

Download Node.js 14.21.3 from: https://nodejs.org/dist/v14.21.3/node-v14.21.3-x64.msi

### Option 2: Upgrade to SPFx 1.18+ (FUTURE)

Upgrade the SPFx project to version 1.18+ which supports Node.js 18 and 20.

```powershell
# This requires significant refactoring
pnpm upgrade @microsoft/sp-build-web@latest @microsoft/generator-sharepoint@latest
```

**Note:** This option requires:
- Updating all SPFx package versions
- Migrating from Gulp to modern build tools
- Testing compatibility with shared components
- Updating TypeScript version

### Option 3: Use Docker Container (ADVANCED)

Run the SPFx build in a Docker container with Node.js 14.

```dockerfile
FROM node/14-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install -g gulp-cli pnpm@8
RUN pnpm install
COPY . .
CMD ["gulp", "serve"]
```

## After Installing Node.js 14

Once you have Node.js 14 installed:

```powershell
# Navigate to SPFx project
cd packages/frontend-spfx

# Clean previous builds
gulp clean

# Bundle the project
gulp bundle

# Serve in workbench
gulp serve
```

## Verification Checklist

- [ ] Node.js version is 14.x (`node --version`)
- [ ] PNPM is installed (`pnpm --version`)
- [ ] Gulp CLI is installed globally (`gulp --version`)
- [ ] Dependencies are installed (`pnpm install`)
- [ ] Build succeeds (`gulp bundle`)
- [ ] Workbench opens (`gulp serve`)

## Development Workflow

### For SPFx Development
```powershell
nvm use 14.21.3  # or: fnm use 14.21.3
cd packages/frontend-spfx
gulp serve
```

### For Backend/Frontend-Standalone Development
```powershell
nvm use 24.13.0  # or: fnm use 24.13.0
pnpm run dev
```

## Package Manager Compatibility

| Node Version | npm | pnpm | yarn |
|--------------|-----|------|------|
| 14.21.3      | 6.x | 8.x  | 1.x  |
| 18.20.0+     | 9.x | 9.x+ | 4.x+ |
| 20.x+        | 10.x| 9.x+ | 4.x+ |

## Additional Resources

- [SPFx Development Environment Setup](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-development-environment)
- [SPFx Version Compatibility](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/compatibility)
- [NVM for Windows](https://github.com/coreybutler/nvm-windows)
- [Fast Node Manager (fnm)](https://github.com/Schniz/fnm)

## Current Project Status

✅ SPFx project configured with shared components
✅ Web parts updated to use @compliance/shared-components
✅ Build configuration ready
⚠️ Requires Node.js 14.x to build and run
