from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from groq import Groq
from dotenv import load_dotenv
import os, uuid, json

load_dotenv()
from datetime import datetime
from database import get_client, create_ticket, get_tickets, init_db

app = FastAPI(title="TeleCom Chatbot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Groq config ──────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
groq_client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """Eres TeleBot, el asistente virtual de soporte técnico de TeleCom S.A.

{client_context}

INSTRUCCIONES:
- Responde siempre en español, con empatía y precisión técnica.
- Cuando el usuario reporte una avería o problema técnico grave, incluye al final:
  [CREAR_TICKET: descripción breve del problema]
- Para problemas de conectividad: guía paso a paso (reiniciar router, verificar cables, luces).
- Para consultas de factura: usa los datos del cliente.
- Sé conciso. Máximo 4 párrafos.
"""

# Sesiones en memoria (en producción usar Redis)
sessions: dict = {}

# ── Schemas ────────────────────────────────────────────────
class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    client_id: Optional[int] = None

class ChatResponse(BaseModel):
    session_id: str
    response: str
    ticket_created: Optional[dict] = None

class TicketCreate(BaseModel):
    client_id: int
    description: str
    priority: str = "media"

# ── Endpoints ──────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    init_db()

@app.get("/")
def root():
    return {"status": "TeleCom Chatbot API running"}

@app.get("/clients/{client_id}")
def get_client_info(client_id: int):
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return client

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    # Session management
    session_id = req.session_id or str(uuid.uuid4())
    if session_id not in sessions:
        sessions[session_id] = []

    # Build client context
    client_context = "No hay cliente seleccionado."
    if req.client_id:
        client = get_client(req.client_id)
        if client:
            client_context = f"""Cliente activo:
- Nombre: {client['name']}
- ID: {client['code']}
- Plan: {client['plan']}
- Factura: {client['invoice']}
- Estado: {client['status']}
- Equipo: {client['equipment']}"""

    # Call Groq
    try:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT.format(client_context=client_context)},
            *sessions[session_id][-10:],
            {"role": "user", "content": req.message}
        ]
        groq_response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages
        )
        reply = groq_response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error Groq: {str(e)}")

    # Save to history
    sessions[session_id].append({"role": "user", "content": req.message})
    sessions[session_id].append({"role": "assistant", "content": reply})

    # Check for ticket creation
    ticket_data = None
    import re
    match = re.search(r'\[CREAR_TICKET:\s*(.+?)\]', reply, re.IGNORECASE)
    if match and req.client_id:
        desc = match.group(1).strip()
        ticket = create_ticket(req.client_id, desc)
        ticket_data = ticket
        reply = re.sub(r'\[CREAR_TICKET:[^\]]+\]', '', reply).strip()

    return ChatResponse(
        session_id=session_id,
        response=reply,
        ticket_created=ticket_data
    )

@app.get("/tickets/{client_id}")
def list_tickets(client_id: int):
    return get_tickets(client_id)

@app.post("/tickets")
def new_ticket(data: TicketCreate):
    ticket = create_ticket(data.client_id, data.description, data.priority)
    return ticket

@app.put("/tickets/{ticket_id}/close")
def close_ticket(ticket_id: str):
    # In production: update DB
    return {"ticket_id": ticket_id, "status": "closed"}
