import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API v1 Router
const v1Router = express.Router();
import guestRoutes from './routes/guest.routes';
import ownerRoutes from './routes/owner.routes';
import profileRoutes from './routes/profile.routes';
import tournamentRoutes from './routes/tournament.routes';
import sponsorRoutes from './routes/sponsor.routes';

v1Router.get('/status', (req, res) => {
  res.json({ message: 'v1 API is running' });
});

v1Router.use('/guest', guestRoutes);
v1Router.use('/owner', ownerRoutes);
v1Router.use('/profile', profileRoutes);
v1Router.use('/tournament', tournamentRoutes);
v1Router.use('/sponsor', sponsorRoutes);

app.use('/api/v1', v1Router);

// Central Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket Server
const wss = new WebSocketServer({ server });

import { handleGuestConnection, handleOwnerConnection } from './websockets/guest.ws';

// Namespaces implementation (simple path routing for WS)
wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  const path = req.url || '/';

  if (path.startsWith('/guest')) {
    console.log('Guest connected');
    handleGuestConnection(ws);
  } else if (path.startsWith('/owner')) {
    console.log('Owner connected');
    handleOwnerConnection(ws, path);
  } else {
    // Unrecognized namespace
    ws.close();
  }
});

// Start Server
server.listen(port, () => {
  console.log(`[Server] running at http://localhost:${port}`);
  console.log(`[WebSocket] running at ws://localhost:${port}`);
});
