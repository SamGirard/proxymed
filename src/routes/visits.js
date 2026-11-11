const express = require('express');
const router  = express.Router();
const db      = require('../db/database');
const { notifyNurse } = require('../fcm');

// ─── GET /api/visits ─────────────────────────────────────────────────────────
// Toutes les visites (médecin et infirmier)
router.get('/', (req, res) => {
  const { nurseId, archived } = req.query;

  let query = 'SELECT * FROM Visit';
  const params = [];
  const conditions = [];

  if (nurseId) {
    conditions.push('nurseId = ?');
    params.push(nurseId);
  }
  if (archived !== undefined) {
    conditions.push('archived = ?');
    params.push(archived === 'true' ? 1 : 0);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY id DESC';

  const visits = db.prepare(query).all(...params);
  res.json(visits);
});

// ─── GET /api/visits/:id ─────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const visit = db.prepare('SELECT * FROM Visit WHERE id = ?').get(req.params.id);
  if (!visit) return res.status(404).json({ error: 'Visite introuvable' });
  res.json(visit);
});

// ─── POST /api/visits ────────────────────────────────────────────────────────
// Créer une visite
router.post('/', (req, res) => {
  const {
    patientName, patientId, nurseId, date,
    photoUri, pression, glycemia, weight,
    respRate, heartRate, spo2,
    generalState, extraNotes,
    latitude, longitude, address
  } = req.body;

  if (!nurseId) {
    return res.status(400).json({ error: 'nurseId est requis' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO Visit (
        patientName, patientId, nurseId, date,
        photoUri, pression, glycemia, weight,
        respRate, heartRate, spo2,
        generalState, extraNotes,
        latitude, longitude, address,
        archived
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      patientName || null, patientId || null, nurseId, date || new Date().toISOString(),
      photoUri || null, pression || null, glycemia || null, weight || null,
      respRate || null, heartRate || null, spo2 || null,
      generalState || null, extraNotes || null,
      latitude || null, longitude || null, address || null
    );

    const visit = db.prepare('SELECT * FROM Visit WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(visit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/visits/:id ─────────────────────────────────────────────────────
// Modifier une visite (infirmier)
router.put('/:id', (req, res) => {
  const {
    patientName, patientId, date, photoUri,
    pression, glycemia, weight,
    respRate, heartRate, spo2,
    generalState, extraNotes,
    latitude, longitude, address
  } = req.body;

  const existing = db.prepare('SELECT id FROM Visit WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Visite introuvable' });

  db.prepare(`
    UPDATE Visit SET
      patientName = ?, patientId = ?, date = ?, photoUri = ?,
      pression = ?, glycemia = ?, weight = ?,
      respRate = ?, heartRate = ?, spo2 = ?,
      generalState = ?, extraNotes = ?,
      latitude = ?, longitude = ?, address = ?
    WHERE id = ?
  `).run(
    patientName, patientId, date, photoUri,
    pression, glycemia, weight,
    respRate, heartRate, spo2,
    generalState, extraNotes,
    latitude, longitude, address,
    req.params.id
  );

  const visit = db.prepare('SELECT * FROM Visit WHERE id = ?').get(req.params.id);
  res.json(visit);
});

// ─── PUT /api/visits/:id/note ─────────────────────────────────────────────────
// Médecin laisse une note
router.put('/:id/note', (req, res) => {
  const { doctorNote } = req.body;

  if (doctorNote === undefined) {
    return res.status(400).json({ error: 'doctorNote est requis' });
  }

  const existing = db.prepare('SELECT id FROM Visit WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Visite introuvable' });

  db.prepare('UPDATE Visit SET doctorNote = ? WHERE id = ?').run(doctorNote, req.params.id);

  const visit = db.prepare('SELECT * FROM Visit WHERE id = ?').get(req.params.id);
  if (doctorNote && doctorNote.trim() !== '') {
    notifyNurse(
      visit.nurseId,
      'Visite traitée',
      `Le médecin a ajouté une note à la visite de ${visit.patientName || 'un patient'}`,
      { visitId: String(visit.id), type: 'note' }
    );
  }
  res.json({ message: 'Note ajoutée', visit });
});

// ─── PUT /api/visits/:id/archive ─────────────────────────────────────────────
// Médecin archive une visite
router.put('/:id/archive', (req, res) => {
  const existing = db.prepare('SELECT * FROM Visit WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Visite introuvable' });

  db.prepare('UPDATE Visit SET archived = 1 WHERE id = ?').run(req.params.id);

  notifyNurse(
    existing.nurseId,
    'Visite traitée',
    `La visite de ${existing.patientName || 'un patient'} a été archivée par le médecin`,
    { visitId: String(existing.id), type: 'archive' }
  );

  res.json({ message: 'Visite archivée' });
});

// ─── DELETE /api/visits/:id ───────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM Visit WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Visite introuvable' });
  res.json({ message: 'Visite supprimée' });
});

module.exports = router;