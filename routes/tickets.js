const router = require('express').Router();
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const { sendResolvedEmail } = require('./emails');

function genId() {
  return 'TKT-' + Date.now().toString(36).toUpperCase();
}
function ts() {
  return new Date().toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// GET todos los tickets
router.get('/', authMiddleware, async (req, res) => {
  let query = supabase
    .from('tickets')
    .select('*, users(fname,lname,email,phone), companies(name,rnc)')
    .order('created_at', { ascending: false });
 if (req.user.role === 'client') {
    query = query.eq('user_id', req.user.id);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST crear ticket
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, category, priority, assignee, user_id, company_id } = req.body;
  if (!title) return res.status(400).json({ error: 'El título es requerido' });

  const uid = req.user.role === 'admin' ? (user_id || null) : req.user.id;
  const { data: userData } = await supabase
    .from('users').select('company_id').eq('id', uid).single();
  const coId = company_id || userData?.company_id || null;

  const history = [{ t: ts(), msg: 'Ticket creado' }];
  if (assignee) history.push({ t: ts(), msg: `Asignado a ${assignee}` });

  const { data, error } = await supabase.from('tickets').insert({
    id: genId(),
    title, description, category,
    priority: priority || 'medium',
    status: assignee ? 'in-progress' : 'open',
    assignee: assignee || null,
    user_id: uid, company_id: coId, history
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH actualizar ticket
router.patch('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const { data: current } = await supabase
    .from('tickets').select('*').eq('id', id).single();
  if (!current) return res.status(404).json({ error: 'Ticket no encontrado' });

  const history = current.history || [];
  const labels = {
    open: 'Abierto', 'in-progress': 'En Progreso',
    pending: 'Pendiente', resolved: 'Resuelto', closed: 'Cerrado'
  };

  if (updates.status && updates.status !== current.status) {
    history.push({ t: ts(), msg: `Estado → ${labels[updates.status] || updates.status}` });
    if (updates.status === 'resolved' || updates.status === 'closed') {
      updates.resolved_at = ts();
      updates.survey_done = false;
      updates.conformity_done = false;
      try {
        await sendResolvedEmail({ ...current, ...updates });
      } catch(e) {
        console.error('Email error:', e.message);
      }
    }
  }

  if (updates.assignee && updates.assignee !== current.assignee) {
    history.push({ t: ts(), msg: `Asignado a ${updates.assignee}` });
  }

  if (updates.conformity_done) {
    updates.conformity_date = ts();
    history.push({ t: ts(), msg: 'Cliente confirmó conformidad del servicio' });
  }

  updates.history = history;

  const { data, error } = await supabase
    .from('tickets').update(updates).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE eliminar ticket
router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No autorizado' });
  }
  const { error } = await supabase.from('tickets').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;