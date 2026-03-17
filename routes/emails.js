const router = require('express').Router();
const nodemailer = require('nodemailer');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

// Configurar transporte de correo
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Función principal para enviar correo de incidente resuelto
async function sendResolvedEmail(ticket) {
  const { data: user } = await supabase
    .from('users').select('fname,lname,email').eq('id', ticket.user_id).single();
  const { data: company } = await supabase
    .from('companies').select('name').eq('id', ticket.company_id).single();
  if (!user) return;

  const surveyUrl = `${process.env.FRONTEND_URL}/encuesta-satisfaccion.html?ticket=${ticket.id}`;
  const prioLabels = { critical:'Crítica', high:'Alta', medium:'Media', low:'Baja' };

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a202c">
    <div style="background:linear-gradient(135deg,#0d1117,#1a2744);padding:28px 24px;border-radius:8px 8px 0 0">
      <div style="font-size:11px;color:#00d4a8;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px">
        HelpDesk CMD Tech
      </div>
      <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:4px">
        ✅ Reporte de Incidente Resuelto
      </div>
      <div style="font-size:12px;color:#94a3b8">
        Ticket ${ticket.id} · ${ticket.resolved_at}
      </div>
    </div>
    <div style="background:#f8fafc;padding:24px">
      <p style="margin:0 0 16px;font-size:14px">
        Hola <strong>${user.fname} ${user.lname}</strong>,
      </p>
      <p style="margin:0 0 20px;color:#475569;line-height:1.7">
        Tu solicitud de soporte ha sido <strong style="color:#0d9488">resuelta</strong>.
        Aquí está el reporte completo del incidente:
      </p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:20px">
        <tr><td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#64748b;width:130px">Ticket ID</td>
            <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#0d9488;font-family:monospace">${ticket.id}</td></tr>
        <tr><td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#64748b">Empresa</td>
            <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9">${company?.name || '—'}</td></tr>
        <tr><td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#64748b">Categoría</td>
            <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9">${ticket.category}</td></tr>
        <tr><td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#64748b">Prioridad</td>
            <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9">${prioLabels[ticket.priority] || ticket.priority}</td></tr>
        <tr><td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#64748b">Técnico</td>
            <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9"><strong>${ticket.assignee || '—'}</strong></td></tr>
        <tr><td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#64748b">Creado</td>
            <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9">${ticket.created_at}</td></tr>
        <tr><td style="padding:10px 16px;font-size:11px;color:#64748b">Resuelto</td>
            <td style="padding:10px 16px">${ticket.resolved_at}</td></tr>
      </table>
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:20px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:8px">
          Descripción del problema
        </div>
        <p style="margin:0;color:#334155;line-height:1.7">${ticket.description || '—'}</p>
      </div>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin-bottom:16px;text-align:center">
        <div style="font-size:14px;font-weight:700;color:#166534;margin-bottom:8px">
          ¿Tu problema fue resuelto correctamente?
        </div>
        <div style="font-size:12px;color:#16a34a;margin-bottom:14px">
          Confirma tu conformidad desde el portal
        </div>
        <a href="${process.env.FRONTEND_URL}" style="background:#16a34a;color:#fff;padding:11px 28px;border-radius:8px;font-weight:700;font-size:13px;text-decoration:none;display:inline-block">
          Ir al portal →
        </a>
      </div>
      <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:20px;text-align:center">
        <div style="font-size:14px;font-weight:700;color:#1e40af;margin-bottom:8px">
          ⭐ ¿Cómo fue tu experiencia?
        </div>
        <div style="font-size:12px;color:#3b82f6;margin-bottom:14px">
          Completa nuestra encuesta de satisfacción (1 minuto)
        </div>
        <a href="${surveyUrl}" style="background:#2563eb;color:#fff;padding:11px 28px;border-radius:8px;font-weight:700;font-size:13px;text-decoration:none;display:inline-block">
          Llenar encuesta →
        </a>
      </div>
    </div>
    <div style="padding:14px;background:#f1f5f9;text-align:center;font-size:11px;color:#94a3b8;border-radius:0 0 8px 8px">
      HelpDesk CMD Tech · ithelpdesk@cmdtechrd.com · 809-740-5191
    </div>
  </div>`;

  await transporter.sendMail({
    from: `"${process.env.SMTP_NAME}" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: `[${ticket.id}] ✅ Reporte de Incidente — ${ticket.title}`,
    html,
  });

  // Guardar en log de correos
  await supabase.from('emails').insert({
    ticket_id: ticket.id,
    to_email: user.email,
    to_name: `${user.fname} ${user.lname}`,
    subject: `[${ticket.id}] Reporte de Incidente — ${ticket.title}`,
    trigger_type: 'resolved'
  });
}

// GET log de correos
router.get('/', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('emails')
    .select('*')
    .order('sent_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
module.exports.sendResolvedEmail = sendResolvedEmail;