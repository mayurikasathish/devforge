# Piston Setup Analysis & Recommended Solution

## Problem Summary

The current `ghcr.io/engineer-man/piston:latest` image **requires**:
1. `--privileged` flag for cgroup v2 access
2. Manual installation of language packages (image ships empty)
3. Pure cgroup v2 system (no hybrid v1+v2)

The container entrypoint creates cgroup directories in `/sys/fs/cgroup/isolate/` which requires privileged mode on Windows/WSL2.

## Key Findings

### 1. Piston Version History
- **Current image** (Feb 2025): `ghcr.io/engineer-man/piston:latest`
  - Empty image, no pre-installed language runtimes
  - Requires manual package installation via CLI
  - CLI tool is broken in the current image (Node.js compatibility issues)
  
- **DevForge Design**: Built for Piston when it had simpler setup
  - The LANG_MAP in `backend/routes/api/code.js` specifies:
    - javascript: 18.15.0
    - python: 3.10.0
    - java: 15.0.2
    - c++: 10.2.0
    - go: 1.16.2
    - rust: 1.68.2
    - bash: 5.2.0

### 2. Docker Desktop on Windows/WSL2 Compatibility
- ✅ **Supports** cgroup v2 (since WSL 2.5.1+)
- ✅ **Supports** `--privileged` flag
- ❌ **Does NOT work** without `--privileged` due to cgroup restrictions
- ⚠️ **Security**: `--privileged` gives the container near-host-level access

### 3. Official Piston Setup (from GitHub)
```bash
docker run \
  --privileged \
  -v $PWD/packages:/piston/packages \
  -p 2000:2000 \
  --name piston \
  ghcr.io/engineer-man/piston
```

Then install packages:
```bash
docker exec piston sh -c "node /piston_api/src/ppman/index.js install python javascript java"
```

**Problem**: The CLI tool (`/piston_api/src/ppman`) doesn't exist in the current image.

### 4. Piston API Status (2026)
⚠️ **Important**: The public Piston API was discontinued on Feb 15, 2026
- Self-hosting is still fully supported and encouraged
- All code is open-source

## Recommended Solutions

### Option 1: Switch to Judge0 (RECOMMENDED for Production)

Judge0 is more mature, better documented, and works reliably on Windows/WSL2.

**Pros:**
- ✅ Pre-built images with all languages included
- ✅ Better Windows/WSL2 support
- ✅ Active development and documentation
- ✅ Production-ready architecture
- ✅ Sub-50ms response times for self-hosted

**Cons:**
- ❌ More complex setup (requires PostgreSQL + Redis for full features)
- ❌ Simple mode available but still heavier than Piston

**Simple Setup:**
```bash
docker run \
  -p 2358:2358 \
  --name judge0 \
  judge0/judge0:latest
```

**Required Code Changes:**
- Minimal changes to `backend/routes/api/code.js`
- Judge0 API is similar to Piston's API format

### Option 2: Keep Local Execution Only (SIMPLEST)

Since Piston is complex to set up and the current image is broken, remove Piston entirely and rely on local Node.js/Python execution.

**Pros:**
- ✅ No Docker required
- ✅ Works immediately
- ✅ No security concerns with `--privileged`
- ✅ Good enough for development/learning

**Cons:**
- ❌ Only JavaScript/TypeScript and Python
- ❌ No Java, C++, Go, Rust, Bash
- ❌ 8-second timeout limit

**Implementation:**
- Already implemented in `backend/routes/api/code.js`
- Just remove all Piston documentation
- Update UI to show only JS/Python options

### Option 3: Fix Piston with Privileged Mode (Current Workaround)

Use `--privileged` flag but accept that packages must be manually installed or pre-cached.

**Working Command:**
```bash
docker run -d \
  --name piston \
  --privileged \
  --restart unless-stopped \
  -p 2000:2000 \
  -v piston_packages:/piston/packages \
  ghcr.io/engineer-man/piston:latest
```

**Then manually install packages** (if CLI works):
```bash
# This may fail due to CLI issues in current image
docker exec piston node /piston_api/src install-packages.js
```

**Pros:**
- ✅ Uses Piston as originally intended
- ✅ Lightweight compared to Judge0

**Cons:**
- ❌ Requires `--privileged` (security risk)
- ❌ Empty image, manual package installation required
- ❌ CLI is currently broken
- ❌ No clear documentation on package installation

### Option 4: Build Custom Piston Image with Pre-installed Packages

Create a Dockerfile that extends Piston and pre-installs all required languages.

**Pros:**
- ✅ One-time setup
- ✅ Packages persist in image
- ✅ Can be shared/versioned

**Cons:**
- ❌ Requires building custom image
- ❌ Still needs `--privileged`
- ❌ Large image size (~2-3GB)

## Recommendation for DevForge

**For Local Development:**
→ **Option 2: Local Execution Only**
- Simplest for users to set up
- JavaScript and Python cover most learning scenarios
- No Docker complexity

**For Production/Advanced Users:**
→ **Option 1: Switch to Judge0**
- More reliable and better documented
- Worth the extra complexity for full language support

**Quick Win (Today):**
→ Keep the current local execution, document that Piston is optional/advanced

## Security Considerations

### Why `--privileged` is Required

Piston's entrypoint script (`/piston_api/src/docker-entrypoint.sh`) performs these operations:
```bash
cd /sys/fs/cgroup && \
mkdir isolate/ && \
echo 1 > isolate/cgroup.procs && \
echo '+cpuset +cpu +io +memory +pids' > cgroup.subtree_control
```

This requires:
1. Write access to `/sys/fs/cgroup` (host kernel interface)
2. Ability to manipulate cgroup controllers
3. Privileged cgroup operations

### Risk Assessment

Running Piston with `--privileged`:
- ⚠️ **High Risk** for production environments
- ⚠️ **Medium Risk** for trusted development teams
- ✅ **Acceptable** for single-user local development

The container can:
- Access host devices
- Modify kernel parameters
- Potentially escape container isolation

### Mitigation

If you must use `--privileged`:
1. Run on isolated development machines only
2. Don't expose port 2000 to external networks
3. Use firewall rules to restrict access
4. Consider running in a dedicated VM

## Implementation Steps

### Immediate Fix (Use Privileged Mode)

1. **Update setup-piston.bat:**
```batch
docker run -d ^
  --name piston ^
  --privileged ^
  --restart unless-stopped ^
  -p 2000:2000 ^
  -v piston_packages:/piston/packages ^
  ghcr.io/engineer-man/piston:latest
```

2. **Update setup-piston.sh:**
```bash
docker run -d \
  --name piston \
  --privileged \
  --restart unless-stopped \
  -p 2000:2000 \
  -v piston_packages:/piston/packages \
  ghcr.io/engineer-man/piston:latest
```

3. **Add warning to documentation:**
```
⚠️ SECURITY WARNING: Piston requires --privileged mode which gives
the container extensive system access. Only use on trusted local
development machines. Do NOT expose to public networks.
```

4. **Test that container starts** (it will have no packages)

5. **Document limitation** that languages won't work until packages are installed

### Long-term Fix (Migrate to Judge0 or Local-Only)

See separate implementation guide based on chosen option.

---

## Quick Reference

| Solution | Setup Time | Languages | Security | Reliability |
|----------|------------|-----------|----------|-------------|
| Local Only | 0 min | 2 (JS, Py) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Piston (privileged) | 5 min | 0 (broken) | ⭐⭐ | ⭐⭐ |
| Judge0 | 10 min | 60+ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Custom Piston Image | 30 min | 8 | ⭐⭐ | ⭐⭐⭐ |

## Sources & References

- [Piston GitHub Repository](https://github.com/engineer-man/piston)
- [Piston API Documentation](https://piston.readthedocs.io/en/latest/api-v2/)
- [Judge0 GitHub Repository](https://github.com/judge0/judge0)
- [WSL2 cgroupsv2 Guide](https://github.com/spurin/wsl-cgroupsv2)
- [Docker Desktop WSL2 Backend](https://docs.docker.com/desktop/features/wsl/)
