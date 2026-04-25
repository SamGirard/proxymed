const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../proxymed.db');

const db = new Database(DB_PATH);

// Activer les foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Création des tables ────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS Nurse (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nom       TEXT NOT NULL,
    prenom    TEXT NOT NULL,
    adresse   TEXT,
    email     TEXT UNIQUE NOT NULL,
    telephone TEXT,
    password  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Doctor (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    nom             TEXT NOT NULL,
    prenom          TEXT NOT NULL,
    numeroPraticien TEXT UNIQUE NOT NULL,
    specialite      TEXT
  );

  CREATE TABLE IF NOT EXISTS Patient (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nom           TEXT NOT NULL,
    prenom        TEXT NOT NULL,
    dateNaissance TEXT,
    telephone     TEXT
  );

  CREATE TABLE IF NOT EXISTS Visit (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    patientName  TEXT,
    patientId    INTEGER,
    nurseId      INTEGER,
    date         TEXT,
    photoUri     TEXT,
    pression     INTEGER,
    glycemia     REAL,
    weight       REAL,
    respRate     INTEGER,
    heartRate    INTEGER,
    spo2         INTEGER,
    generalState TEXT,
    extraNotes   TEXT,
    latitude     REAL,
    longitude    REAL,
    address      TEXT,
    doctorNote   TEXT,
    archived     INTEGER DEFAULT 0,
    FOREIGN KEY (nurseId)   REFERENCES Nurse(id),
    FOREIGN KEY (patientId) REFERENCES Patient(id)
  );
`);

// ─── Données de test par défaut ─────────────────────────────────────────────

db.prepare('DELETE FROM Doctor').run();

db.prepare(`
  INSERT INTO Doctor (nom, prenom, numeroPraticien, specialite)
  VALUES (?, ?, ?, ?)
`).run('Fomkoung', 'Michael', 'doc-1001', 'Médecine générale');

console.log('✅ Base de données prête :', DB_PATH);

module.exports = db;