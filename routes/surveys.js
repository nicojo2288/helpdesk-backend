const router = require('express').Router();
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

// GET todas las encuestas
router.get('/', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('surveys')
    .select(`
      *,
      tickets (
        title,
        assignee,
        user_id,
        company_id,
        users ( fname, lname ),
        companies ( name )
      )
    `)
    .order('submitted_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST enviar encuesta
router.post('/', async (req, res) => {
  const { ticket_id, rating, response_time, clarity, comments } = req.body;
  if (!ticket_id || !rating) {
    return res.status(400).json({ error: 'Ticket y calificación son requeridos' });
  }

  // Marcar ticket como encuesta completada
  await supabase
    .from('tickets')
    .update({ survey_done: true })
    .eq('id', ticket_id);

  const { data, error } = await supabase
    .from('surveys')
    .insert({ ticket_id, rating, response_time, clarity, comments })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;