// src/services/sseService.js
const clients = new Map(); // key: clientId, value: { userId, res }
let clientCounter = 1;

export const addClient = (userId, res) => {
  const id = String(clientCounter++);
  clients.set(id, { userId, res });
  return id;
};

export const removeClient = (clientId) => {
  clients.delete(clientId);
};

export const broadcastToUser = (userId, event, data) => {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  for (const [id, client] of clients.entries()) {
    if (client.userId === userId) {
      try {
        client.res.write(`event: ${event}\n`);
        client.res.write(`data: ${payload}\n\n`);
      } catch (err) {
        // ignore write errors; client will be cleaned up when connection closes
        console.warn('[sseService] write error for client', id, err?.message || err);
      }
    }
  }
};

export const broadcastAll = (event, data) => {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  for (const [id, client] of clients.entries()) {
    try {
      client.res.write(`event: ${event}\n`);
      client.res.write(`data: ${payload}\n\n`);
    } catch (err) {
      console.warn('[sseService] write error for client', id, err?.message || err);
    }
  }
};

export const getClientsCount = () => clients.size;

export default {
  addClient,
  removeClient,
  broadcastToUser,
  broadcastAll,
  getClientsCount,
};
