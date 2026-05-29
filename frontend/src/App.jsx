import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_URL || "";

const CLIENTS = [
  { id: 1, name: "Carlos Mendoza", code: "CL-0042" },
  { id: 2, name: "Ana Torres",     code: "CL-0118" },
  { id: 3, name: "Luis García",    code: "CL-0275" },
];

const QUICK = [
  { icon: "🌐", text: "No tengo internet, ¿qué hago?" },
  { icon: "💳", text: "¿Cuánto debo en mi última factura?" },
  { icon: "🔐", text: "Quiero cambiar mi contraseña del WiFi" },
  { icon: "⚡", text: "El internet está muy lento" },
  { icon: "🔧", text: "Quiero reportar una avería" },
  { icon: "📋", text: "¿Cuál es el estado de mi solicitud?" },
];

export default function App() {
  const [messages, setMessages]       = useState([WELCOME]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [sessionId, setSessionId]     = useState(null);
  const [clientId, setClientId]       = useState(null);
  const [clientInfo, setClientInfo]   = useState(null);
  const [tickets, setTickets]         = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function selectClient(id) {
    setClientId(id);
    setSessionId(null);
    setMessages([WELCOME]);
    setTickets([]);
    if (!id) { setClientInfo(null); return; }
    try {
      const { data } = await axios.get(`${API_BASE}/clients/${id}`);
      setClientInfo(data);
      pushBot(`Cliente cargado: <b>${data.name}</b> (${data.code})<br/>Plan: ${data.plan}<br/><br/>¿En qué puedo ayudarte hoy?`);
      // Load existing tickets
      const t = await axios.get(`${API_BASE}/tickets/${id}`);
      setTickets(t.data);
    } catch { pushBot("⚠️ Error cargando datos del cliente."); }
  }

  async function send(text) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg, time: now() }]);
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/chat`, {
        session_id: sessionId,
        message: msg,
        client_id: clientId || null,
      });
      setSessionId(data.session_id);
      pushBot(data.response, data.ticket_created);
      if (data.ticket_created) {
        setTickets(prev => [data.ticket_created, ...prev]);
      }
    } catch (e) {
      pushBot(`❌ Error: ${e.response?.data?.detail || e.message}`);
    }
    setLoading(false);
  }

  function pushBot(text, ticket = null) {
    setMessages(prev => [...prev, { role: "bot", text, ticket, time: now() }]);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className="app">

      {/* TOPBAR */}
      <header className="topbar">
        <div className="brand">
          <span className="logo">📡</span>
          <div>
            <div className="brand-name">Tele<span>Com</span> S.A.</div>
            <div className="brand-sub">Sistema de Soporte Técnico Inteligente</div>
          </div>
        </div>
        <div className="status-pill">
          <span className="dot" /> Sistema Operativo
        </div>
      </header>

      <div className="main">

        {/* SIDEBAR */}
        <aside className="sidebar">

          <section className="sbox">
            <div className="sec-title">Cliente Activo</div>
            <select className="client-sel" onChange={e => selectClient(Number(e.target.value) || null)}>
              <option value="">— Seleccionar —</option>
              {CLIENTS.map(c => (
                <option key={c.id} value={c.id}>{c.name} · #{c.code}</option>
              ))}
            </select>
            {clientInfo && (
              <div className="client-card">
                <div className="c-name">{clientInfo.name} · #{clientInfo.code}</div>
                <div className="c-plan">{clientInfo.plan}</div>
                <div className="c-rows">
                  <Row label="Factura" value={clientInfo.invoice} />
                  <Row label="Estado"  value={clientInfo.status}
                    color={clientInfo.status === "Al día" ? "var(--green)" : "var(--orange)"} />
                  <Row label="Equipo"  value={clientInfo.equipment} />
                </div>
              </div>
            )}
          </section>

          <section className="sbox">
            <div className="sec-title">Consultas Rápidas</div>
            <div className="quick-list">
              {QUICK.map((q, i) => (
                <button key={i} className="qbtn" onClick={() => send(q.text)}>
                  <span>{q.icon}</span> {q.text}
                </button>
              ))}
            </div>
          </section>

          <section className="sbox flex1">
            <div className="sec-title">Tickets</div>
            <div className="ticket-list">
              {tickets.length === 0
                ? <div className="no-tickets">Sin tickets activos</div>
                : tickets.map(t => (
                    <div key={t.id} className={`ticket ${t.status}`}>
                      <div className="t-id">{t.id}</div>
                      <div className="t-desc">{t.description}</div>
                      <div className={`t-status ${t.status}`}>
                        {t.status === "open" ? "⏳ Abierto" : "✅ Cerrado"}
                      </div>
                    </div>
                  ))
              }
            </div>
          </section>

        </aside>

        {/* CHAT */}
        <div className="chat">
          <div className="messages">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                <div className={`avatar ${m.role}`}>{m.role === "bot" ? "🤖" : "👤"}</div>
                <div>
                  <div className="bubble"
                    dangerouslySetInnerHTML={{ __html: formatText(m.text) }} />
                  {m.ticket && (
                    <div className="ticket-card">
                      🎫 <b>Ticket #{m.ticket.id}</b> creado<br />
                      {m.ticket.description}<br />
                      <span style={{ color: "var(--green)" }}>Abierto · Prioridad: {m.ticket.priority}</span>
                    </div>
                  )}
                  <div className="btime">{m.time}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="msg bot">
                <div className="avatar bot">🤖</div>
                <div className="bubble typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="inputbar">
            <textarea
              className="input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribe tu consulta aquí..."
              rows={1}
            />
            <button className="sendbtn" onClick={() => send()} disabled={loading || !input.trim()}>
              ➤
            </button>
          </div>
          <div className="hint">Enter para enviar · Shift+Enter para nueva línea</div>
        </div>

      </div>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────
const WELCOME = {
  role: "bot",
  text: "¡Hola! Soy <b>TeleBot</b>, el asistente virtual de TeleCom S.A. 👋<br/><br/>Selecciona un cliente en el panel izquierdo y escribe tu consulta.",
  time: now(),
};

function now() {
  return new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

function formatText(t) {
  return t
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

function Row({ label, value, color }) {
  return (
    <div className="c-row">
      <span>{label}</span>
      <span style={color ? { color } : {}}>{value}</span>
    </div>
  );
}
