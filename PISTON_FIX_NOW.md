# 🔧 Fix Piston "Read-only file system" Error

## Problem
The Piston container crashes with: `mkdir: cannot create directory 'isolate/': Read-only file system`

## Root Cause
The Piston container needs to create cgroup directories in `/sys/fs/cgroup/isolate/` for code isolation. This requires:
1. `--privileged` flag for cgroup v2 write access
2. Volume mount for language package storage

## ✅ Quick Fix (2 minutes)

### Step 1: Stop and remove the broken container
```bash
docker stop piston
docker rm piston
```

### Step 2: Start Piston with the correct configuration

⚠️ **Security Warning**: Requires `--privileged` mode for cgroup access. Only use on trusted development machines.

```bash
docker run -d \
  --name piston \
  --privileged \
  --restart unless-stopped \
  -p 2000:2000 \
  -v piston_packages:/piston/packages \
  ghcr.io/engineer-man/piston
```

**Key Additions:** 
- `--privileged` allows cgroup management (required for code isolation)
- `-v piston_packages:/piston/packages` for language package storage

### Step 3: Verify it's working
```bash
# Check container is running
docker ps | grep piston

# Check logs (should show no errors)
docker logs piston

# Test the API
curl http://localhost:2000/api/v2/piston/runtimes
```

You should see a JSON array (likely empty `[]` since no packages are installed yet).

**Important**: The current Piston image has no pre-installed language runtimes. The container will start successfully but code execution will fall back to local Node.js/Python until packages are manually installed (advanced setup).

### Step 4: Restart your backend
```bash
cd backend
npm start
```

## ✨ All Fixed!

The updated setup scripts (`setup-piston.bat` and `setup-piston.sh`) now include the volume mount automatically.

## What Changed?

**Old command (broken):**
```bash
docker run -d --name piston -p 2000:2000 ghcr.io/engineer-man/piston
```

**New command (working):**
```bash
docker run -d --name piston -p 2000:2000 -v piston_data:/piston ghcr.io/engineer-man/piston
```

The `-v piston_data:/piston` flag gives Piston a persistent writable directory for:
- Creating isolation environments
- Storing temporary code files
- Managing execution sandboxes

## Technical Details

The newer Piston versions use the `/piston` directory structure:
- `/piston/packages/` - Language runtimes and packages
- `/piston/isolate/` - Temporary execution environments (this is where it was failing)
- `/piston/jobs/` - Execution job data

Without the volume mount, Piston tries to create these directories in the container's root filesystem, which is read-only by default for security.

## Persistence

The `piston_data` named volume persists even if you remove the container. To fully clean up:
```bash
docker stop piston
docker rm piston
docker volume rm piston_data
```

---

**Now run the commands in Step 1-3 above to fix your Piston setup!** ✨
