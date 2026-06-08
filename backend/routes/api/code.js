const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Temp dir for code files
const TMP = os.tmpdir();

// Unique filename per request
function tmpFile(ext) {
  return path.join(TMP, `devforge_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
}

// Run JavaScript code with timeout
function runJS(filePath, stdin = '', timeout = 8000) {
  return new Promise((resolve) => {
    const proc = spawn('node', [filePath], {
      timeout,
      killSignal: 'SIGKILL',
    });

    let stdout = '', stderr = '';

    if (stdin) proc.stdin.write(stdin);
    proc.stdin.end();

    proc.stdout.on('data', d => { stdout += d; });
    proc.stderr.on('data', d => { stderr += d; });

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
    }, timeout);

    proc.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({
        stdout: stdout.slice(0, 10000),
        stderr: stderr.slice(0, 5000),
        code: signal === 'SIGKILL' ? -1 : (code ?? 0),
        timedOut: signal === 'SIGKILL',
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({ stdout: '', stderr: err.message, code: 1, timedOut: false });
    });
  });
}

// POST /api/code/execute
router.post('/execute', async (req, res) => {
  const { language, code, stdin = '' } = req.body;

  if (!code?.trim()) {
    return res.status(400).json({ success: false, error: 'No code provided' });
  }

  if (language !== 'javascript') {
    return res.status(400).json({
      success: false,
      error: 'Only JavaScript is currently supported'
    });
  }

  const filePath = tmpFile('js');

  try {
    // Inject polyfills for browser APIs to make them work in Node.js
    const polyfills = `
// Browser API polyfills for Node.js
global.prompt = function(message) {
  return null; // Returns null like when user cancels
};

global.alert = function(message) {
  console.log('[ALERT]:', message);
};

global.confirm = function(message) {
  console.log('[CONFIRM]:', message);
  return true;
};

global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({}),
  body: {}
};

global.window = global;

// User code starts here:
`;

    const wrappedCode = polyfills + code;
    fs.writeFileSync(filePath, wrappedCode);
    const result = await runJS(filePath, stdin);

    if (result.timedOut) {
      return res.json({
        success: false,
        output: 'Execution timed out (8s limit)',
        error: 'Timeout'
      });
    }

    let output = (result.stdout + result.stderr).trim();
    const isError = result.code !== 0;

    return res.json({
      success: !isError,
      output: output || '(no output)',
      error: isError ? result.stderr : null,
      exitCode: result.code
    });

  } catch (err) {
    console.error('Code execution error:', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  } finally {
    try {
      fs.unlinkSync(filePath);
    } catch (_) {}
  }
});

// GET /api/code/languages
router.get('/languages', (req, res) => {
  res.json({
    success: true,
    languages: ['javascript']
  });
});

module.exports = router;
