# TeleCom S.A. — Chatbot de Soporte Técnico Inteligente
### Proyecto Integrador · Grupo 5 · Administración de Sistemas

---

## Estructura del proyecto

```
telecom-chatbot/
├── backend/
│   ├── main.py          ← API FastAPI + Gemini
│   ├── database.py      ← SQLite (clientes, tickets, mensajes)
│   ├── requirements.txt
│   └── .env             ← Tu API Key aquí
├── frontend/
│   ├── src/
│   │   ├── App.jsx      ← Componente principal React
│   │   ├── App.css      ← Estilos
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   └── package.json
└── README.md
```

---

## Requisitos previos

- Python 3.10+
- Node.js 18+
- API Key de Google Gemini → https://aistudio.google.com/app/apikey

---

## Pasos para correr el proyecto

### 1. Backend (FastAPI)

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar API Key
# Edita .env y reemplaza: GEMINI_API_KEY=tu_api_key_aqui

# Correr el servidor
uvicorn main:app --reload --port 8000
```

El backend corre en: http://localhost:8000
Documentación automática en: http://localhost:8000/docs

---

### 2. Frontend (React)

Abre una nueva terminal:

```bash
cd frontend

# Instalar dependencias
npm install

# Correr la app
npm start
```

La app abre en: http://localhost:3000

---

## Cómo usar el sistema (demo)

1. Con ambos servidores corriendo, abre http://localhost:3000
2. En el panel izquierdo, selecciona un cliente (Carlos, Ana o Luis)
3. Escribe una consulta o usa los botones de Consultas Rápidas
4. Si reportas una avería, el sistema **crea un ticket automáticamente**
5. Los tickets aparecen en el panel lateral

### Consultas de ejemplo para la demo:
- "No tengo internet desde esta mañana"
- "¿Cuánto debo en mi última factura?"
- "El internet está muy lento, ¿qué velocidad tengo?"
- "Quiero cambiar la contraseña de mi WiFi"
- "Hay una avería en mi servicio desde hace 2 horas"

---

## Tecnologías utilizadas

| Componente | Tecnología |
|---|---|
| Backend | Python 3.12 + FastAPI |
| Base de datos | SQLite (dev) / PostgreSQL (prod) |
| IA | Google Gemini 2.0 Flash |
| Frontend | React 18 + CSS |
| HTTP Client | Axios |
| Servidor dev | Uvicorn |

---

## Endpoints de la API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Health check |
| GET | `/clients/{id}` | Datos de un cliente |
| POST | `/chat` | Enviar mensaje al chatbot |
| GET | `/tickets/{client_id}` | Tickets de un cliente |
| POST | `/tickets` | Crear ticket manual |
| PUT | `/tickets/{id}/close` | Cerrar ticket |

---

*Nota: Elaboración Propia. Prototipo funcional para fines académicos.*
