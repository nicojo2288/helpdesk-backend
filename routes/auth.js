const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

// REGISTRO
router.post('/register', async (req, res) => {
  const { fname, lname, email, phone, position, password, companyName, rnc } = req.body;
  if (!fname || !lname || !email || !password || !companyName || !rnc) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  // Verificar si el correo ya existe
  const { data: existing } = await supabase
    .from('users').select('id').eq('email', email).single();
  if (existing) return res.status(400).json({ error: 'Este correo ya está registrado' });

  // Crear o encontrar empresa
  let company;
  const { data: existingCo } = await supabase
    .from('companies').select('*').eq('rnc', rnc).single();
  if (existingCo) {
    company = existingCo;
  } else {
    const { data: newCo, error: coErr } = await supabase
      .from('companies').insert({ name: companyName, rnc }).select().single();
    if (coErr) return res.status(500).json({ error: coErr.message });
    company = newCo;
  }

  // Encriptar contraseña y crear usuario
  const hashed = await bcrypt.hash(password, 10);
  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert({ fname, lname, email, phone, position, password: hashed, company_id: company.id, role: 'client' })
    .select().single();
  if (userErr) return res.status(500).json({ error: userErr.message });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { ...user, password: undefined }, company });
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Correo y contraseña requeridos' });

  const { data: user } = await supabase
    .from('users').select('*, companies(*)').eq('email', email).single();
  if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { ...user, password: undefined } });
});

module.exports = router;