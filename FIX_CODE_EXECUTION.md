# 🔧 Fix Code Execution - Complete Guide

## 🚨 Current Issue
Code execution is timing out because local execution has limitations.

## ✅ THE SOLUTION (Choose One)

---

### 🎯 **OPTION 1: Quick Fix with Piston (RECOMMENDED)**

This will enable **ALL languages** (JS, Python, Java, C++, Go, Rust, Bash, TypeScript)

#### Windows:
```bash
# Step 1: Check if Docker is installed
check-docker.bat

# Step 2: Install Piston (if Docker is ready)
setup-piston.bat

# Step 3: Restart backend
cd backend
npm start
```

#### Mac/Linux:
```bash
# Step 1: Check Docker
docker --version

# Step 2: Install Piston
chmod +x setup-piston.sh
./setup-piston.sh

# Step 3: Restart backend
cd backend
npm start
```

**That's it!** All languages will work perfectly.

---

### 🐌 **OPTION 2: Keep Local Execution (Limited)**

If you can't install Docker right now:

**What works:**
- ✅ JavaScript (basic code only)
- ✅ Python (basic code only)
- ❌ Loops/input may timeout
- ❌ Java, C++, Go, Rust, Bash won't work

**No setup needed** - just restart backend:
```bash
cd backend
npm start
```

---

## 🐳 Don't Have Docker?

### Install Docker Desktop:

**Windows:**
1. Download: https://docs.docker.com/desktop/install/windows-install/
2. Install and restart computer
3. Run `setup-piston.bat`

**Mac:**
1. Download: https://docs.docker.com/desktop/install/mac-install/
2. Install
3. Run `./setup-piston.sh`

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Then run
./setup-piston.sh
```

---

## 🧪 Test After Setup

### Test 1: Simple JavaScript
```javascript
console.log("Hello World!");
console.log(2 + 2);
```

Expected: 
```
Hello World!
4
```

### Test 2: Python Loop
```python
for i in range(5):
    print(f"Number: {i}")
```

Expected:
```
Number: 0
Number: 1
Number: 2
Number: 3
Number: 4
```

### Test 3: C++ (only with Piston)
```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello from C++!" << endl;
    return 0;
}
```

---

## 🔍 Troubleshooting

### "Execution timeout"
**Cause:** Local execution hit time limit  
**Fix:** Set up Piston with `setup-piston.bat`

### "Docker not installed"
**Fix:** Install Docker Desktop (links above), then run `setup-piston.bat`

### "Docker not running"
**Fix:** Start Docker Desktop app, then run `setup-piston.bat`

### "Port 2000 already in use"
```bash
# Use different port
docker run -d --name piston -p 2001:2000 -v piston_data:/piston ghcr.io/engineer-man/piston

# Update backend/.env
PISTON_URL=http://localhost:2001/api/v2/piston/execute
```

### Backend shows old error
```bash
# Restart backend
cd backend
npm start
```

### Piston not working
```bash
# Check status
docker ps | grep piston

# Restart
docker restart piston

# View logs
docker logs piston

# Reinstall
docker stop piston
docker rm piston
setup-piston.bat  # or ./setup-piston.sh
```

---

## 📊 Comparison

| Method | Setup Time | Languages | Reliability | Timeout Issues |
|--------|------------|-----------|-------------|----------------|
| **Piston (Docker)** | 2 min | 8+ languages | ⭐⭐⭐⭐⭐ | Never |
| **Local Execution** | 0 min | JS, Python | ⭐⭐ | Sometimes |

---

## 🎯 Recommended Steps (Right Now)

```bash
# 1. Check Docker
check-docker.bat

# 2. If Docker is installed and running:
setup-piston.bat

# 3. Restart backend
cd backend
npm start

# 4. Test in a room's Code tab
```

**Total time: 2-5 minutes**  
**Result: All languages work perfectly** ✨

---

## 💡 Why Piston?

- ✅ Supports 8+ languages
- ✅ Safe sandboxed execution
- ✅ No timeout issues
- ✅ Production-ready
- ✅ Free and open-source
- ✅ Used by thousands of projects

---

## 📝 Files You Need

All setup files are in your project root:

1. **check-docker.bat** - Check if Docker is ready
2. **setup-piston.bat** - Install Piston (Windows)
3. **setup-piston.sh** - Install Piston (Mac/Linux)
4. **PISTON_SETUP.md** - Detailed documentation

---

## ⚡ Quick Commands Reference

```bash
# Check setup
check-docker.bat

# Install Piston
setup-piston.bat

# Check if running
docker ps | grep piston

# View logs
docker logs piston

# Restart Piston
docker restart piston

# Stop Piston
docker stop piston

# Start Piston
docker start piston

# Remove Piston
docker stop piston && docker rm piston
```

---

## 🎉 Success Checklist

- [ ] Docker Desktop installed
- [ ] Docker is running
- [ ] Ran `setup-piston.bat` successfully
- [ ] Backend restarted
- [ ] Tested code execution in a room
- [ ] All languages work

---

**Need help?** Check `PISTON_SETUP.md` for detailed instructions.
