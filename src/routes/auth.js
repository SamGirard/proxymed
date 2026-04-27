const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const db      = require('../db/database');

// ─── POST /api/auth/signup ──────────────────────────────────────────────────
// Création de compte infirmier
router.post('/signup', (req, res) => {
  const { nom, prenom, adresse, email, telephone, password } = req.body;

  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }

  // Vérifier si email déjà utilisé
  const existing = db.prepare('SELECT id FROM Nurse WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email déjà utilisé' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    const result = db.prepare(`
      INSERT INTO Nurse (nom, prenom, adresse, email, telephone, password)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nom, prenom, adresse || '', email, telephone || '', hashedPassword);

    const nurse = db.prepare('SELECT id, nom, prenom, adresse, email, telephone FROM Nurse WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json({ message: 'Compte créé', nurse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/signin ──────────────────────────────────────────────────
// Connexion infirmier
router.post('/signin', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  const nurse = db.prepare('SELECT * FROM Nurse WHERE email = ?').get(email);
  if (!nurse) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  const valid = bcrypt.compareSync(password, nurse.password);
  if (!valid) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  // Retourner le profil sans le mot de passe
  const { password: _, ...nurseData } = nurse;
  res.json({ message: 'Connexion réussie', nurse: nurseData, role: 'nurse' });
});

// ─── POST /api/auth/signin-doctor ───────────────────────────────────────────
// Connexion médecin (par numéro de praticien)
router.post('/signin-doctor', (req, res) => {
  const { numeroPraticien } = req.body;

  if (!numeroPraticien) {
    return res.status(400).json({ error: 'Numéro de praticien requis' });
  }

  const doctor = db.prepare('SELECT * FROM Doctor WHERE numeroPraticien = ?').get(numeroPraticien);
  if (!doctor) {
    return res.status(401).json({ error: 'Numéro de praticien introuvable' });
  }

  res.json({ message: 'Connexion réussie', doctor, role: 'doctor' });
});

// ─── POST /api/auth/reset-password ──────────────────────────────────────────
// Réinitialisation du mot de passe
router.post('/reset-password', (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email et nouveau mot de passe requis' });
  }

  const nurse = db.prepare('SELECT id FROM Nurse WHERE email = ?').get(email);
  if (!nurse) {
    return res.status(404).json({ error: 'Aucun compte avec cet email' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE Nurse SET password = ? WHERE email = ?').run(hashedPassword, email);

  res.json({ message: 'Mot de passe mis à jour' });
});

// ─── PUT /api/auth/nurse/:id ──────────────────────────────────────────────────
router.put('/nurse/:id', (req, res) => {
  const { nom, prenom, adresse, email, telephone } = req.body;

  const existing = db.prepare('SELECT id FROM Nurse WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Infirmier introuvable' });

  db.prepare(`
    UPDATE Nurse SET nom = ?, prenom = ?, adresse = ?, email = ?, telephone = ?
    WHERE id = ?
  `).run(nom, prenom, adresse, email, telephone, req.params.id);

  const nurse = db.prepare('SELECT id, nom, prenom, adresse, email, telephone FROM Nurse WHERE id = ?')
    .get(req.params.id);
  res.json(nurse);
});

module.exports = router;