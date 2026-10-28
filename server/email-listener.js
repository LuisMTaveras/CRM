/**
 * CRM Email Background Listener Daemon — DEVFORGE CRM
 * Escucha continua en segundo plano del servidor IMAP para emitir notificaciones
 * nativas de Windows en tiempo real incluso cuando el navegador web está cerrado.
 */

import { ImapFlow } from 'imapflow';
import { notificarEscritorioWindows } from './whatsapp/notificador-windows.js';
import { opcionesTls } from './tls-options.js';

class ServicioEscuchaEmail {
  constructor() {
    this.activo = false;
    this.conectado = false;
    this.verificando = false;
    this.intervaloMs = 15000; // 15 segundos
    this.timer = null;
    this.client = null;
    this.ultimoUidConocido = 0;
    this.totalCorreosNotificados = 0;
    this.ultimaVerificacion = null;
    this.ultimoError = null;
    this.suscriptoresSSE = new Set();
    this.configGetter = null;
    this.correosEnMemoriaRef = null;
    this.guardarDbFn = null;
    this.parsearMensajeFn = null;
  }

  /**
   * Suscribe un cliente HTTP (SSE) para recibir eventos en tiempo real
   */
  suscribirSSE(res) {
    this.suscriptoresSSE.add(res);
  }

  /**
   * Desuscribe un cliente HTTP (SSE)
   */
  desuscribirSSE(res) {
    this.suscriptoresSSE.delete(res);
  }

  /**
   * Emite un evento a todos los navegadores web conectados
   */
  emitirEvento(tipo, data) {
    const payload = `event: ${tipo}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of this.suscriptoresSSE) {
      try {
        res.write(payload);
      } catch {
        this.suscriptoresSSE.delete(res);
      }
    }
  }

  /**
   * Inicializa el servicio de escucha en segundo plano
   */
  async iniciar({ configGetter, correosEnMemoriaRef, guardarDbFn, parsearMensajeFn, intervaloSegundos = 15 }) {
    if (this.activo) {
      console.log('ℹ️ [EMAIL LISTENER] El servicio ya se encuentra activo.');
      return;
    }

    this.configGetter = configGetter;
    this.correosEnMemoriaRef = correosEnMemoriaRef;
    this.guardarDbFn = guardarDbFn;
    this.parsearMensajeFn = parsearMensajeFn;
    this.intervaloMs = Math.max(8000, intervaloSegundos * 1000);
    this.activo = true;

    // Calcular el UID máximo actual de la base de datos local para no repetir avisos pasados
    if (Array.isArray(this.correosEnMemoriaRef)) {
      const uids = this.correosEnMemoriaRef.map((c) => c.uid).filter(Boolean);
      this.ultimoUidConocido = uids.length > 0 ? Math.max(...uids) : 0;
    }

    console.log(`\n🎧 [EMAIL LISTENER] Servicio de escucha de correo iniciado.`);
    console.log(`   Intervalo: ${this.intervaloMs / 1000}s | Último UID conocido en DB: ${this.ultimoUidConocido}`);

    // Ejecutar primera verificación de sincronización
    this.programarSiguienteVerificacion(1000);
  }

  /**
   * Detiene el ciclo de escucha
   */
  async detener() {
    this.activo = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.client) {
      try {
        await this.client.logout();
      } catch {}
      this.client = null;
    }
    this.conectado = false;
    console.log('🛑 [EMAIL LISTENER] Servicio de escucha detenido.');
  }

  programarSiguienteVerificacion(ms) {
    if (!this.activo) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.ejecutarCicloVerificacion().finally(() => {
        if (this.activo) {
          this.programarSiguienteVerificacion(this.intervaloMs);
        }
      });
    }, ms);
  }

  /**
   * Ciclo de verificación de nuevos correos vía IMAP
   */
  async ejecutarCicloVerificacion() {
    if (!this.activo || this.verificando) return;
    this.verificando = true;

    const config = typeof this.configGetter === 'function' ? this.configGetter() : null;
    if (!config || !config.habilitarImap || !config.servidorImap || !config.usuarioImap || !config.contrasenaImap) {
      this.ultimoError = 'Configuración IMAP incompleta o deshabilitada.';
      this.verificando = false;
      return;
    }

    // Si está en modo demo / simulación, no consultar servidor remoto
    if (config.usuarioImap?.includes('@ejemplo.com') || config.usuarioImap?.includes('@empresa.com')) {
      this.verificando = false;
      return;
    }

    try {
      // Reutilizar cliente si sigue conectado o crear nueva instancia
      if (!this.client || !this.client.usable) {
        this.client = new ImapFlow({
          host: config.servidorImap,
          port: parseInt(config.puertoImap || '993'),
          secure: config.seguridadImap === 'ssl' || parseInt(config.puertoImap) === 993,
          auth: {
            user: config.usuarioImap,
            pass: config.contrasenaImap,
          },
          logger: false,
          tls: opcionesTls(),
          connectionTimeout: 10000,
          socketTimeout: 20000,
        });

        await this.client.connect();
        this.conectado = true;
      }

      this.ultimaVerificacion = new Date();
      this.ultimoError = null;

      // Obtener estado rápido de la bandeja de entrada (INBOX) en milisegundos
      const status = await this.client.status('INBOX', { uidNext: true, messages: true, unseen: true });

      // Si es la primera vez que se consulta y no teníamos UID local, guardar el punto de partida
      if (this.ultimoUidConocido === 0 && status.uidNext) {
        this.ultimoUidConocido = Math.max(1, status.uidNext - 1);
        console.log(`[EMAIL LISTENER] Punto de partida inicial fijado en UID: ${this.ultimoUidConocido}`);
        this.verificando = false;
        return;
      }

      // Si uidNext es mayor al último UID que conocemos, ¡HAY NUEVO CORREO!
      if (status.uidNext && status.uidNext > this.ultimoUidConocido + 1) {
        const uidDesde = this.ultimoUidConocido + 1;
        console.log(`⚡ [EMAIL LISTENER] ¡Nuevos correos detectados en el servidor! Buscando rango UID: ${uidDesde}:*`);

        const lock = await this.client.getMailboxLock('INBOX');
        const nuevosEncontrados = [];

        try {
          for await (let msg of this.client.fetch({ uid: `${uidDesde}:*` }, {
            uid: true,
            flags: true,
            envelope: true,
            source: true,
          })) {
            if (msg.uid > this.ultimoUidConocido) {
              const correoMapeado = await this.parsearMensajeFn(msg, config, 'inbox', false);
              nuevosEncontrados.push(correoMapeado);
              if (msg.uid > this.ultimoUidConocido) {
                this.ultimoUidConocido = msg.uid;
              }
            }
          }
        } finally {
          lock.release();
        }

        if (nuevosEncontrados.length > 0) {
          // Guardar en la base de datos local y memoria
          for (const nuevo of nuevosEncontrados) {
            if (!this.correosEnMemoriaRef.some((c) => c.id === nuevo.id || c.uid === nuevo.uid)) {
              this.correosEnMemoriaRef.unshift(nuevo);
            }

            // Emitir notificación nativa de Windows (incluso con navegador cerrado)
            const remitente = nuevo.de?.nombre || nuevo.de?.correo || 'Remitente externo';
            const asunto = nuevo.asunto || '(Sin asunto)';

            console.log(`📢 [NOTIFICACIÓN CORREO] Emitiendo Toast Windows para: "${asunto}" de ${remitente}`);
            const portFrontend = process.env.VITE_PORT || process.env.FRONTEND_PORT || 3000;
            notificarEscritorioWindows(
              `Nuevo Correo: ${remitente}`,
              `Asunto: ${asunto}\nBandeja de entrada • CRM`,
              `http://localhost:${portFrontend}/comunicaciones`,
              'email'
            );

            this.totalCorreosNotificados++;

            // Emitir SSE a navegadores conectados
            this.emitirEvento('correo_nuevo', nuevo);
          }

          if (typeof this.guardarDbFn === 'function') {
            this.guardarDbFn();
          }

          // Emitir actualización de contadores
          const noLeidos = this.correosEnMemoriaRef.filter((c) => !c.leido && c.carpeta === 'inbox').length;
          this.emitirEvento('conteo_actualizado', {
            noLeidos,
            total: this.correosEnMemoriaRef.length,
          });
        }
      }
    } catch (err) {
      this.ultimoError = err.message;
      this.conectado = false;
      // Cerrar socket defectuoso para reconectar en el próximo ciclo
      if (this.client) {
        try { await this.client.logout(); } catch {}
        this.client = null;
      }
    } finally {
      this.verificando = false;
    }
  }

  /**
   * Retorna el estado público actual del servicio
   */
  obtenerEstado() {
    return {
      activo: this.activo,
      conectado: this.conectado,
      intervaloSegundos: this.intervaloMs / 1000,
      ultimoUidConocido: this.ultimoUidConocido,
      totalCorreosNotificados: this.totalCorreosNotificados,
      ultimaVerificacion: this.ultimaVerificacion ? this.ultimaVerificacion.toISOString() : null,
      ultimoError: this.ultimoError,
      clientesConectadosSSE: this.suscriptoresSSE.size,
    };
  }
}

export const servicioEscuchaEmail = new ServicioEscuchaEmail();
