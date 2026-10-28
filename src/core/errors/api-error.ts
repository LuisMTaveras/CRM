/**
 * ⚡ DEVFORGE API Error Normalizer
 * Extracts consistent, user-friendly localized error messages and field validation maps
 * from Axios, Fetch, Laravel, Express, NestJS, FastAPI, and Django error responses.
 */

export interface NormalizedError {
  message: string;
  status: number;
  fieldErrors: Record<string, string>;
  original: unknown;
}

export function normalizeApiError(error: unknown, fallbackMessage = 'Ocurrió un error inesperado al procesar la solicitud.'): NormalizedError {
  let status = 500;
  let message = fallbackMessage;
  const fieldErrors: Record<string, string> = {};

  if (!error) {
    return { message, status, fieldErrors, original: error };
  }

  // Handle Axios / Fetch response-like objects
  const err = error as { response?: unknown; message?: unknown };
  const response = (err.response ?? err) as Record<string, unknown>;

  if (typeof response.status === 'number') {
    status = response.status;
  }

  const data: unknown = response.data ?? response;

  // 1. Status specific default messages
  if (status === 401) {
    message = 'Sesión expirada o credenciales inválidas. Por favor, inicia sesión nuevamente.';
  } else if (status === 403) {
    message = 'No tienes permisos suficientes para realizar esta acción.';
  } else if (status === 404) {
    message = 'El recurso solicitado no fue encontrado o no está disponible.';
  } else if (status === 500) {
    message = 'Error interno en el servidor. Por favor, intenta más tarde o contacta al administrador.';
  }

  // 2. Extract backend custom messages if available
  if (typeof data === 'string' && data.trim()) {
    message = data;
  } else if (data && typeof data === 'object') {
    const payload = data as Record<string, unknown>;

    // Laravel / NestJS standard: { message: "..." }
    if (typeof payload.message === 'string' && payload.message.trim()) {
      message = payload.message;
    } else if (typeof payload.error === 'string' && payload.error.trim()) {
      message = payload.error;
    } else if (typeof payload.detail === 'string' && payload.detail.trim()) {
      // FastAPI / Django standard: { detail: "..." }
      message = payload.detail;
    }

    // 3. Extract Field Validation Errors
    // Laravel: { errors: { email: ["El correo ya existe"] } }
    if (payload.errors && typeof payload.errors === 'object') {
      for (const [field, errorList] of Object.entries(payload.errors as Record<string, unknown>)) {
        if (Array.isArray(errorList) && errorList.length > 0) {
          fieldErrors[field] = String(errorList[0]);
        } else if (typeof errorList === 'string') {
          fieldErrors[field] = errorList;
        }
      }
    }

    // FastAPI: { detail: [{ loc: ["body", "email"], msg: "..." }] }
    if (Array.isArray(payload.detail)) {
      for (const item of payload.detail) {
        if (!item || typeof item !== 'object') continue;
        const detalle = item as Record<string, unknown>;
        if (Array.isArray(detalle.loc) && detalle.msg) {
          const fieldName = String(detalle.loc[detalle.loc.length - 1]);
          fieldErrors[fieldName] = String(detalle.msg);
        }
      }
    }
  }

  // Fallback to error.message (e.g. Network Error / timeout)
  if (typeof err.message === 'string' && (!message || message === fallbackMessage)) {
    if (err.message.includes('Network Error')) {
      message = 'Error de conexión. Verifica tu acceso a internet o el estado del servidor.';
    } else {
      message = err.message;
    }
  }

  return {
    message,
    status,
    fieldErrors,
    original: error,
  };
}
