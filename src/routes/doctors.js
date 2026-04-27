const express = require('express');
const router  = express.Router();
const db      = require('../db/database');

// ─── GET /api/doctors ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const doctors = db.prepare('SELECT * FROM Doctor ORDER BY nom ASC').all();
  res.json(doctors);
});

// ─── GET /api/doctors/:id ────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const doctor = db.prepare('SELECT * FROM Doctor WHERE id = ?').get(req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Médecin introuvable' });
  res.json(doctor);
});


// ─── PUT /api/doctors/:id ─────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const { nom, prenom, specialite } = req.body;

  const existing = db.prepare('SELECT id FROM Doctor WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Médecin introuvable' });

  db.prepare(`
    UPDATE Doctor SET nom = ?, prenom = ?, specialite = ?
    WHERE id = ?
  `).run(nom, prenom, specialite, req.params.id);

  const doctor = db.prepare('SELECT * FROM Doctor WHERE id = ?').get(req.params.id);
  res.json(doctor);
});
module.exports = router;