const express = require('express');
const router  = express.Router();
const db      = require('../db/database');

// ─── GET /api/patients ───────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const patients = db.prepare('SELECT * FROM Patient ORDER BY nom ASC').all();
  res.json(patients);
});

// ─── GET /api/patients/:id ───────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const patient = db.prepare('SELECT * FROM Patient WHERE id = ?').get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient introuvable' });
  res.json(patient);
});

// ─── POST /api/patients ──────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { nom, prenom, dateNaissance, telephone } = req.body;

  if (!nom || !prenom) {
    return res.status(400).json({ error: 'Nom et prénom sont requis' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO Patient (nom, prenom, dateNaissance, telephone)
      VALUES (?, ?, ?, ?)
    `).run(nom, prenom, dateNaissance || null, telephone || null);

    const patient = db.prepare('SELECT * FROM Patient WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/patients/:id ───────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const { nom, prenom, dateNaissance, telephone } = req.body;

  const existing = db.prepare('SELECT id FROM Patient WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Patient introuvable' });

  db.prepare(`
    UPDATE Patient SET nom = ?, prenom = ?, dateNaissance = ?, telephone = ?
    WHERE id = ?
  `).run(nom, prenom, dateNaissance, telephone, req.params.id);

  const patient = db.prepare('SELECT * FROM Patient WHERE id = ?').get(req.params.id);
  res.json(patient);
});

// ─── DELETE /api/patients/:id ────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM Patient WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Patient introuvable' });
  res.json({ message: 'Patient supprimé' });
});

module.exports = router;