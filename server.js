require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: ['https://helpdesk.cmdtechrd.com', 'http://localhost:3000', 'http://localhost:4008'],
  credentials: true
}));
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});