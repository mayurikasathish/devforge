# Code Execution Setup Guide

## Problem
The public Piston API (emkc.org) has been **whitelist-only since February 15, 2026**. Direct frontend calls now return a 401 error with the message:
> "Public Piston API is now whitelist only. Please contact EngineerMan on Discord with use case justification or consider hosting your own Piston instance."

## Solution Implemented
We've added a **backend proxy** at `/api/code/execute` that handles code execution requests. This gives you flexibility to:
1. Use your own Piston instance
2. Switch to alternative services
3. Request whitelist access from Piston

## Current Status
✅ Frontend updated to use backend proxy
✅ Backend endpoint created at `/api/code/execute`
✅ Informative error messages when service is unavailable

## Options to Enable Code Execution

### Option 1: Self-Host Piston (Recommended)
Deploy your own Piston instance:

```bash
# Using Docker
docker run -d \
  --name piston \
  -p 2000:2000 \
  ghcr.io/engineer-man/piston
```

Then set environment variable:
```bash
# In backend/.env
PISTON_URL=http://localhost:2000/api/v2/piston/execute
```

Full guide: https://github.com/engineer-man/piston

### Option 2: Use Piston Public API (Requires Approval)
Contact EngineerMan on Discord to request whitelist access for your domain.

### Option 3: Alternative Services
Integrate with services like:
- **Judge0** - https://judge0.com/
- **Sphere Engine** - https://sphere-engine.com/
- **Replit** - https://replit.com/
- **Glot.io** - https://glot.io/

Update `backend/routes/api/code.js` to use your chosen service.

## Testing

### 1. Restart Backend
```bash
cd backend
npm start
```

### 2. Test Endpoint
```bash
curl -X POST http://localhost:5000/api/code/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "javascript",
    "code": "console.log(\"Hello from DevForge!\");"
  }'
```

### 3. Test in Room
1. Go to a room
2. Open the Code tab
3. Write some code (e.g., `console.log('test')`)
4. Click "Run"

## Supported Languages
- JavaScript
- TypeScript
- Python
- Java
- C++
- Go
- Rust
- Bash

## Files Modified
- ✅ `client/src/pages/RoomDetail.jsx` - Updated to use backend proxy
- ✅ `backend/routes/api/code.js` - New endpoint for code execution
- ✅ `backend/server.js` - Registered new route

## Error Messages
Users will see helpful error messages explaining:
- The service is unavailable
- Why it's unavailable (Piston whitelist)
- How to enable it (setup instructions)

## Production Deployment
For production, you MUST:
1. Deploy your own Piston instance (Docker/Kubernetes)
2. Set `PISTON_URL` environment variable
3. Ensure network connectivity between your backend and Piston

## Cost Estimate
**Self-hosted Piston**: Free (just server costs)
- Small VM: ~$5-10/month
- Can handle hundreds of executions per day

**Alternative Services**: $0-100/month depending on usage
- Judge0: Free tier available
- Most have generous free tiers for small projects

## Security Notes
⚠️ Code execution is sandboxed in Piston
⚠️ Set reasonable timeout limits (already configured: 3s runtime, 10s compile)
⚠️ Monitor for abuse if deployed publicly
⚠️ Consider rate limiting in production

## Need Help?
1. Check Piston docs: https://piston.readthedocs.io/
2. Discord: https://discord.gg/engineerman
3. GitHub Issues: https://github.com/engineer-man/piston/issues
