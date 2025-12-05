// src/services/notificationService.js
import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

// Inicializar Firebase Admin si hay credenciales en env
const initFirebaseAdmin = () => {
  if (admin.apps && admin.apps.length > 0) return;

  try {
    if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
      const credJson = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
      admin.initializeApp({
        credential: admin.credential.cert(credJson)
      });
      console.log('✅ Firebase Admin inicializado desde FIREBASE_ADMIN_CREDENTIALS');
      return;
    }

    if (process.env.FIREBASE_ADMIN_KEY_PATH) {
      const keyPath = process.env.FIREBASE_ADMIN_KEY_PATH;
      try {
        const raw = fs.readFileSync(keyPath, 'utf8');
        const keyJson = JSON.parse(raw);
        admin.initializeApp({
          credential: admin.credential.cert(keyJson)
        });
        console.log('✅ Firebase Admin inicializado desde FIREBASE_ADMIN_KEY_PATH');
        return;
      } catch (err) {
        console.warn('⚠️ Falló inicializar desde FIREBASE_ADMIN_KEY_PATH:', err.message);
      }
    }

    // Soporte para la variable estándar de Google (path al JSON)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      try {
        const raw = fs.readFileSync(keyPath, 'utf8');
        const keyJson = JSON.parse(raw);
        admin.initializeApp({
          credential: admin.credential.cert(keyJson)
        });
        console.log('✅ Firebase Admin inicializado desde GOOGLE_APPLICATION_CREDENTIALS');
        return;
      } catch (err) {
        console.warn('⚠️ Falló inicializar desde GOOGLE_APPLICATION_CREDENTIALS:', err.message);
      }
    }

    console.warn('⚠️ No se encontraron credenciales de Firebase Admin. Las notificaciones push no funcionarán sin ellas.');
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin:', error);
  }
};

initFirebaseAdmin();

/**
 * Registrar o actualizar token
 */
export const registerToken = async ({ token, userId = null, platform = 'web' }) => {
  try {
    if (!token) throw new Error('Token requerido');

    console.log('[notificationService] registerToken called', { token: token?.substring(0, 24) + '...', userId, platform });

    // Upsert: si existe, actualizar userId/platform; si no, crear
    const existing = await prisma.notificationToken.findUnique({ where: { token } });

    if (existing) {
      const updated = await prisma.notificationToken.update({ where: { token }, data: { userId, platform } });
      console.log('[notificationService] token updated in DB', { token: updated.token?.substring(0,24) + '...', userId: updated.userId });
      return updated;
    }

    const created = await prisma.notificationToken.create({ data: { token, userId, platform } });
    console.log('[notificationService] token created in DB', { id: created.id, token: created.token?.substring(0,24) + '...', userId: created.userId });
    return created;
  } catch (error) {
    console.error('notificationService.registerToken:', error);
    throw error;
  }
};

export const removeToken = async (token) => {
  try {
    if (!token) throw new Error('Token requerido');
    console.log('[notificationService] removeToken called', { token: token?.substring(0,24) + '...' });
    const deleted = await prisma.notificationToken.deleteMany({ where: { token } });
    console.log('[notificationService] deleteMany result', { count: deleted.count || deleted });
    return true;
  } catch (error) {
    console.error('notificationService.removeToken:', error);
    throw error;
  }
};

/**
 * Enviar notificación a un token FCM
 */
export const sendToToken = async (token, payload) => {
  try {
    if (!admin.apps || admin.apps.length === 0) throw new Error('Firebase Admin no inicializado');
    console.log('[notificationService] sendToToken called', { token: token?.substring(0,24) + '...', notification: payload.notification });

    const message = {
      token,
      notification: payload.notification,
      data: Object.keys(payload.data || {}).reduce((acc, k) => ({ ...acc, [k]: String((payload.data || {})[k]) }), {}),
      webpush: {
        notification: payload.notification,
        fcmOptions: { link: (payload.data && payload.data.url) || '/' }
      }
    };

    try {
      const resp = await admin.messaging().send(message);
      console.log('[notificationService] send success', { token: token?.substring(0,24) + '...', resp });
      return { success: true, resp };
    } catch (sendErr) {
      console.error('[notificationService] send error', { token: token?.substring(0,24) + '...', err: sendErr?.message || sendErr });
      // If token not registered, try to remove from DB
      if (sendErr?.code === 'messaging/registration-token-not-registered' || (sendErr?.message && sendErr.message.includes('not-registered'))) {
        try {
          await prisma.notificationToken.deleteMany({ where: { token } });
          console.log('[notificationService] invalid token removed from DB', { token: token?.substring(0,24) + '...' });
        } catch (delErr) {
          console.warn('[notificationService] failed removing invalid token:', delErr?.message || delErr);
        }
      }
      return { success: false, error: sendErr?.message || sendErr };
    }
  } catch (error) {
    console.error('notificationService.sendToToken error:', error);
    // Si token inválido, eliminar del DB
    if (error?.code === 'messaging/registration-token-not-registered') {
      try { await prisma.notificationToken.deleteMany({ where: { token } }); } catch (e) { }
    }
    return { success: false, error: error.message };
  }
};

/**
 * Enviar notificación a un usuario (todos sus tokens)
 */
export const sendToUser = async (userId, payload) => {
  try {
    console.log('[notificationService] sendToUser called', { userId, notification: payload.notification });
    const tokens = await prisma.notificationToken.findMany({ where: { userId } });
    console.log('[notificationService] tokens found for user', { userId, count: tokens.length });
    const results = [];
    for (const t of tokens) {
      const r = await sendToToken(t.token, payload);
      results.push({ token: t.token?.substring(0,24) + '...', result: r });
    }
    return results;
  } catch (error) {
    console.error('notificationService.sendToUser:', error);
    throw error;
  }
};

/**
 * Enviar notificación a todos los tokens registrados
 */
export const sendToAll = async (payload) => {
  try {
    console.log('[notificationService] sendToAll called', { notification: payload.notification });
    const tokens = await prisma.notificationToken.findMany({});
    console.log('[notificationService] total tokens found', { count: tokens.length });
    const results = [];
    for (const t of tokens) {
      const r = await sendToToken(t.token, payload);
      results.push({ token: t.token?.substring(0,24) + '...', result: r });
    }
    return results;
  } catch (error) {
    console.error('notificationService.sendToAll:', error);
    throw error;
  }
};

/**
 * Listar todos los tokens (para debugging/admin)
 */
export const listAllTokens = async () => {
  try {
    const tokens = await prisma.notificationToken.findMany({ select: { id: true, token: true, userId: true, platform: true, createdAt: true } });
    console.log('[notificationService] listAllTokens count', tokens.length);
    return tokens.map(t => ({ id: t.id, token: t.token?.substring(0,24) + '...', userId: t.userId, platform: t.platform, createdAt: t.createdAt }));
  } catch (error) {
    console.error('notificationService.listAllTokens:', error);
    throw error;
  }
};
