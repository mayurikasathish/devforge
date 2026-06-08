# 🚀 Piston Code Execution Setup

## Quick Setup (Choose One Method)

### Method 1: Automated Setup (Recommended)

**Windows:**
```bash
# Double-click or run in Command Prompt
setup-piston.bat
```

**Mac/Linux:**
```bash
chmod +x setup-piston.sh
./setup-piston.sh
```

### Method 2: Manual Setup (5 minutes)

#### Step 1: Install Docker
- **Windows**: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
- **Mac**: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/)

#### Step 2: Run Piston Container

⚠️ **Security Warning**: Piston requires `--privileged` mode for cgroup access. This gives the container extensive system access. Only use on trusted local development machines. Do NOT expose to public networks.

```bash
docker run -d \
  --name piston \
  --privileged \
  --restart unless-stopped \
  -p 2000:2000 \
  -v piston_packages:/piston/packages \
  ghcr.io/engineer-man/piston
```

📝 **Note**: The current Piston image ships without language runtimes. Manual package installation is required (advanced). For basic development, the local JavaScript/Python fallback will work automatically.

#### Step 3: Configure Backend
Add this to `backend/.env`:
```
PISTON_URL=http://localhost:2000/api/v2/piston/execute
```

#### Step 4: Restart Backend
```bash
cd backend
npm start
```

## ✅ Verify Setup

Test the endpoint:
```bash
curl -X POST http://localhost:5000/api/code/execute \
  -H "Content-Type: application/json" \
  -d '{"language":"javascript","code":"console.log(\"Hello World!\");"}'
```

Expected response:
```json
{
  "output": "Hello World!",
  "error": false
}
```

## 🎯 Supported Languages

Once Piston is running, you can execute:

| Language | File Extension | Example |
|----------|---------------|---------|
| JavaScript | `.js` | `console.log("Hello!");` |
| TypeScript | `.ts` | `console.log("Hello!");` |
| Python | `.py` | `print("Hello!")` |
| Java | `.java` | `System.out.println("Hello!");` |
| C++ | `.cpp` | `std::cout << "Hello!";` |
| Go | `.go` | `fmt.Println("Hello!")` |
| Rust | `.rs` | `println!("Hello!");` |
| Bash | `.sh` | `echo "Hello!"` |

## 🔧 Troubleshooting

### Piston not starting
```bash
# Check Docker logs
docker logs piston

# Restart container
docker restart piston
```

### Port 2000 already in use
```bash
# Use a different port
docker run -d --name piston -p 2001:2000 ghcr.io/engineer-man/piston

# Update backend/.env
PISTON_URL=http://localhost:2001/api/v2/piston/execute
```

### Code execution timing out
- Check if Piston container is running: `docker ps | grep piston`
- Check backend logs for errors
- Try increasing timeout in `backend/routes/api/code.js`

### Docker not installed
Download and install from:
- Windows: https://docs.docker.com/desktop/install/windows-install/
- Mac: https://docs.docker.com/desktop/install/mac-install/
- Linux: https://docs.docker.com/engine/install/

## 🛠️ Useful Commands

```bash
# View Piston logs
docker logs piston

# View live logs
docker logs -f piston

# Stop Piston
docker stop piston

# Start Piston
docker start piston

# Restart Piston
docker restart piston

# Remove Piston (will need to run setup again)
docker stop piston && docker rm piston

# Check Piston status
docker ps | grep piston

# Test Piston directly
curl http://localhost:2000/api/v2/piston/runtimes
```

## 💡 Without Docker (Limited - JS/Python only)

If you can't use Docker, the system will fall back to local execution:
- ✅ JavaScript (using Node.js)
- ✅ Python (if installed on your system)
- ❌ Other languages (require Piston)

## 🔒 Security Notes

⚠️ **Important**: Piston runs in a sandboxed Docker container for security.

- Code execution is isolated
- Default timeout: 10 seconds
- Memory limits are enforced
- Network access is restricted

For production deployments:
1. Consider running Piston on a separate server
2. Implement rate limiting
3. Monitor resource usage
4. Set up authentication if exposed publicly

## 📊 Resource Usage

Typical resource usage:
- **Memory**: ~200-500 MB
- **CPU**: Minimal when idle
- **Disk**: ~500 MB for Docker image

## 🎓 Need Help?

1. **Piston Documentation**: https://piston.readthedocs.io/
2. **Discord**: https://discord.gg/engineerman
3. **GitHub Issues**: https://github.com/engineer-man/piston/issues

## 📝 Architecture

```
User → Frontend (RoomDetail.jsx)
         ↓ POST /api/code/execute
       Backend (code.js)
         ↓ If PISTON_URL set
       Piston Container (Docker)
         ↓ Execute code safely
       Return output
```

## ✨ Features

- ✅ 8+ programming languages
- ✅ Syntax highlighting
- ✅ Real-time output
- ✅ Error messages
- ✅ Timeout protection
- ✅ Isolated execution
- ✅ No installation needed (for users)

---

**Made with ❤️ for DevForge**
