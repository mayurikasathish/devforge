# 🚀 Quick Start - Fix Code Execution

## ⚡ The Problem
Code execution is failing/timing out.

## ✅ The Solution (2 Minutes)

### Step 1: Check Docker
```bash
check-docker.bat
```

### Step 2: Install Piston
```bash
setup-piston.bat
```

### Step 3: Restart Backend
```bash
cd backend
npm start
```

### Step 4: Test
Go to any room → Code tab → Write code → Click Run!

---

## 📝 Example Test Code

**JavaScript:**
```javascript
console.log("Hello World!");
for (let i = 0; i < 5; i++) {
    console.log("Count:", i);
}
```

**Python:**
```python
print("Hello from Python!")
for i in range(5):
    print(f"Number: {i}")
```

---

## 🆘 Don't Have Docker?

### Windows:
1. Download: https://www.docker.com/products/docker-desktop/
2. Install and restart computer
3. Run `setup-piston.bat`

### Mac:
1. Download: https://www.docker.com/products/docker-desktop/
2. Install
3. Run `./setup-piston.sh`

---

## ⚠️ Current Status (Without Piston)

| Feature | Status |
|---------|--------|
| JavaScript | ⚠️ Works but limited |
| Python | ⚠️ Works but limited |
| Other languages | ❌ Not supported |
| Timeouts | ⚠️ May occur |

## ✨ After Piston Setup

| Feature | Status |
|---------|--------|
| JavaScript | ✅ Perfect |
| Python | ✅ Perfect |
| Java, C++, Go, Rust | ✅ All work |
| Timeouts | ✅ Never |

---

## 🎯 That's It!

Total time: **2-5 minutes**

All files are ready in your project folder.

Just run:
1. `check-docker.bat`
2. `setup-piston.bat`
3. Restart backend

Done! 🎉
