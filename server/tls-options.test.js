import { describe, it, expect, afterEach } from 'vitest';
import { opcionesTls } from './tls-options.js';

describe('opcionesTls', () => {
  afterEach(() => {
    delete process.env.EMAIL_TLS_INSECURE;
  });

  it('valida los certificados por defecto', () => {
    expect(opcionesTls()).toEqual({});
  });

  it('permite desactivar la validación solo de forma explícita', () => {
    process.env.EMAIL_TLS_INSECURE = 'true';
    expect(opcionesTls()).toEqual({ rejectUnauthorized: false });
  });

  it('ignora valores distintos de "true"', () => {
    process.env.EMAIL_TLS_INSECURE = '1';
    expect(opcionesTls()).toEqual({});
  });
});
