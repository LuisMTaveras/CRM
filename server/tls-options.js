/**
 * Opciones TLS compartidas para clientes SMTP/IMAP.
 *
 * Por defecto se valida el certificado del servidor. Solo si la cuenta usa un
 * certificado autofirmado se puede habilitar EMAIL_TLS_INSECURE=true.
 */
export function opcionesTls() {
  return process.env.EMAIL_TLS_INSECURE === 'true' ? { rejectUnauthorized: false } : {};
}
