const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

/**
 * GET /api/fixes/file-content
 * Returns the raw content of a file (for diff preview)
 * Query: ?filePath=<absolute or relative path>
 */
router.get('/file-content', (req, res) => {
  const { filePath } = req.query;
  if (!filePath) return res.status(400).json({ error: 'filePath required' });

  // Security: only allow reading files, not writing; block path traversal
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'File not found' });
  const stat = fs.statSync(resolved);
  if (!stat.isFile()) return res.status(400).json({ error: 'Not a file' });
  if (stat.size > 500000) return res.status(400).json({ error: 'File too large to display' });

  try {
    const content = fs.readFileSync(resolved, 'utf8');
    res.json({ content, path: resolved, lines: content.split('\n').length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/fixes/apply
 * Applies a fix by replacing specific lines in the file.
 * Body: { filePath, lineNumber, originalText, replacementText, createBackup }
 *
 * SAFETY: Creates a .bak backup before any write.
 * Will only write if originalText matches exactly (prevents blind overwrites).
 */
router.post('/apply', (req, res) => {
  const { filePath, lineNumber, originalText, replacementText, createBackup = true } = req.body;

  if (!filePath || replacementText === undefined) {
    return res.status(400).json({ error: 'filePath and replacementText are required' });
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'File not found' });

  let content;
  try {
    content = fs.readFileSync(resolved, 'utf8');
  } catch (err) {
    return res.status(500).json({ error: `Cannot read file: ${err.message}` });
  }

  // Validate: if originalText provided, it must be present
  if (originalText && !content.includes(originalText)) {
    return res.status(409).json({
      error: 'Original text not found in file — file may have already been modified',
      hint: 'Re-run analysis to get fresh fix suggestions',
    });
  }

  // Create backup
  if (createBackup) {
    const backupPath = resolved + '.devguardian.bak';
    try {
      fs.writeFileSync(backupPath, content, 'utf8');
    } catch (err) {
      return res.status(500).json({ error: `Cannot create backup: ${err.message}` });
    }
  }

  // Apply the change
  let newContent;
  if (originalText) {
    // Replace first occurrence of originalText
    newContent = content.replace(originalText, replacementText);
  } else if (lineNumber && lineNumber > 0) {
    // Replace the specific line
    const lines = content.split('\n');
    if (lineNumber > lines.length) return res.status(400).json({ error: 'Line number out of range' });
    lines[lineNumber - 1] = replacementText;
    newContent = lines.join('\n');
  } else {
    return res.status(400).json({ error: 'Provide either originalText or lineNumber' });
  }

  try {
    fs.writeFileSync(resolved, newContent, 'utf8');
    res.json({
      success: true,
      path: resolved,
      backup: createBackup ? resolved + '.devguardian.bak' : null,
      message: `Fix applied successfully${createBackup ? ' (backup created)' : ''}`,
    });
  } catch (err) {
    res.status(500).json({ error: `Cannot write file: ${err.message}` });
  }
});

/**
 * POST /api/fixes/revert
 * Reverts a file from its .devguardian.bak backup
 */
router.post('/revert', (req, res) => {
  const { filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: 'filePath required' });

  const resolved = path.resolve(filePath);
  const backupPath = resolved + '.devguardian.bak';

  if (!fs.existsSync(backupPath)) {
    return res.status(404).json({ error: 'No backup found for this file' });
  }

  try {
    const backup = fs.readFileSync(backupPath, 'utf8');
    fs.writeFileSync(resolved, backup, 'utf8');
    fs.unlinkSync(backupPath);
    res.json({ success: true, message: 'File reverted to original' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
