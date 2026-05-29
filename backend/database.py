import sqlite3
import uuid
from datetime import datetime

DB_PATH = "telecom.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            plan TEXT,
            invoice TEXT,
            status TEXT DEFAULT 'Al día',
            last_payment TEXT,
            equipment TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY,
            client_id INTEGER,
            description TEXT,
            priority TEXT DEFAULT 'media',
            status TEXT DEFAULT 'open',
            created_at TEXT,
            FOREIGN KEY(client_id) REFERENCES clients(id)
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            client_id INTEGER,
            role TEXT,
            content TEXT,
            created_at TEXT
        )
    """)

    # Seed clients if empty
    c.execute("SELECT COUNT(*) FROM clients")
    if c.fetchone()[0] == 0:
        clients = [
            (1, "CL-0042", "Carlos Mendoza", "Fibra 200 Mbps · TV Básico",
             "$45.90 (vence 15/06)", "Al día", "15/05/2025", "Router Huawei HG8245H5"),
            (2, "CL-0118", "Ana Torres", "Fibra 500 Mbps · TV Premium",
             "$89.00 (vence 20/06)", "Pendiente", "20/04/2025", "Router Technicolor TC4400"),
            (3, "CL-0275", "Luis García", "ADSL 50 Mbps",
             "$28.50 (vence 10/06)", "Al día", "10/05/2025", "Modem ZTE F680"),
        ]
        c.executemany(
            "INSERT INTO clients VALUES (?,?,?,?,?,?,?,?)", clients
        )

    conn.commit()
    conn.close()
    print("✅ Base de datos inicializada")

def get_client(client_id: int):
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM clients WHERE id = ?", (client_id,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None

def create_ticket(client_id: int, description: str, priority: str = "media"):
    conn = get_connection()
    ticket_id = "TK-" + str(uuid.uuid4())[:6].upper()
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    conn.execute(
        "INSERT INTO tickets VALUES (?,?,?,?,?,?)",
        (ticket_id, client_id, description, priority, "open", now)
    )
    conn.commit()
    conn.close()
    return {
        "id": ticket_id,
        "client_id": client_id,
        "description": description,
        "priority": priority,
        "status": "open",
        "created_at": now
    }

def get_tickets(client_id: int):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM tickets WHERE client_id = ? ORDER BY created_at DESC",
        (client_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
