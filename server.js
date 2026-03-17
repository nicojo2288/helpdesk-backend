require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Rutas
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/tickets',   require('./routes/tickets'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/surveys',   require('./routes/surveys'));
app.use('/api/emails',    require('./routes/emails'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ status: 'HelpDesk CMD Tech API funcionando ✅' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});