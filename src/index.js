const express = require('express');
const cors    = require('cors');

const authRoutes    = require('./routes/auth');
const visitsRoutes  = require('./routes/visits');
const patientsRoutes = require('./routes/patients');
const doctorsRoutes = require('./routes/doctors');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth',     authRoutes);
app.use('/api/visits',   visitsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/doctors',  doctorsRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Api est starté' });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} introuvable` });
});

app.listen(PORT, () => {
  console.log(`Proxymed backend starté sur http://localhost:${PORT}`);
  console.log(`   Routes disponibles :`);
  console.log(`   POST   /api/auth/signup`);
  console.log(`   POST   /api/auth/signin`);
  console.log(`   POST   /api/auth/signin-doctor`);
  console.log(`   POST   /api/auth/reset-password`);
  console.log(`   GET    /api/visits`);
  console.log(`   POST   /api/visits`);
  console.log(`   PUT    /api/visits/:id/note`);
  console.log(`   PUT    /api/visits/:id/archive`);
  console.log(`   GET    /api/patients`);
  console.log(`   POST   /api/patients`);
  console.log(`   GET    /api/doctors`);
});