# CodeSync

A real-time collaborative code editor built with the MERN stack. Multiple users can join a session, edit code together live, and stay in sync via WebSockets.

## Features

- **JWT Authentication** — secure login and session management
- **Real-time collaboration** — live code editing with Socket.io
- **Responsive UI** — light/dark themes, works across screen sizes
- **Private dashboard** — manage your coding sessions
- **Guest join** — enter a session with just an invite ID, no account required

## Tech Stack

- **Frontend:** React, Material UI, CodeMirror, Redux
- **Backend:** Node.js, Express, Socket.io
- **Database:** MongoDB

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)

### 1. Server setup

```bash
cd Server
npm install
```

Create `Server/.env`:

```env
MONGO_SERVER_URI=mongodb://127.0.0.1:27017/codesync
PORT=5001
JWT_SECRET=your_random_secret_string
CLIENT_URL=http://localhost:3000
```

Start the server:

```bash
npm run server:prod
```

### 2. Client setup

```bash
cd Client
npm install
```

Update API URLs if needed in:
- `src/utils/axiosConfig.js`
- `src/socket.js`

Start the client:

```bash
npm start
```

Open **http://localhost:3000**

## Deployment

### Frontend (Vercel)

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. **Root Directory:** leave empty to use repo root, **or** set to `Client` for a client-only project.
3. Add environment variable:
   ```env
   REACT_APP_API_URL=https://your-backend-url.com
   ```
4. Deploy. The included `vercel.json` files configure the React build.

### Backend (Railway / Render — recommended)

The API uses **Socket.IO**, **MongoDB**, and **Docker** for code execution. Deploy the `Server/` folder to Railway or Render, not Vercel.

Required env vars on the backend host:

```env
MONGO_SERVER_URI=your_mongodb_uri
JWT_SECRET=your_secret
CLIENT_URL=https://your-vercel-frontend.vercel.app
PORT=5001
```

The client falls back to Railway in production when `REACT_APP_API_URL` is not set.

## License

MIT — see [LICENSE](LICENSE).
