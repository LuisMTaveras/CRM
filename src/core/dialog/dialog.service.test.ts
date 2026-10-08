import { describe, it, expect, beforeEach } from 'vitest';
import { dialogService } from './dialog.service';

describe('DialogService - Modales Globales de Confirmación y Alerta', () => {
  beforeEach(() => {
    dialogService.estado.value.abierto = false;
    dialogService.estado.value.resolve = undefined;
  });

  it('inicia con el diálogo cerrado', () => {
    expect(dialogService.estado.value.abierto).toBe(false);
  });

  it('abre un diálogo de confirmación y resuelve true al aceptar', async () => {
    const promesa = dialogService.confirmar({
      titulo: 'ELIMINAR ELEMENTO',
      subtitulo: 'CONFIRMA ACCIÓN',
      mensaje: '¿Desea continuar?',
      tipo: 'peligro',
    });

    expect(dialogService.estado.value.abierto).toBe(true);
    expect(dialogService.estado.value.titulo).toBe('ELIMINAR ELEMENTO');
    expect(dialogService.estado.value.tipo).toBe('peligro');
    expect(dialogService.estado.value.soloConfirmar).toBe(false);

    dialogService.aceptar();

    const resultado = await promesa;
    expect(resultado).toBe(true);
    expect(dialogService.estado.value.abierto).toBe(false);
  });

  it('abre un diálogo de confirmación y resuelve false al cancelar', async () => {
    const promesa = dialogService.confirmar({
      titulo: 'RESTABLECER VALORES',
      mensaje: '¿Desea restablecer?',
      tipo: 'advertencia',
    });

    expect(dialogService.estado.value.abierto).toBe(true);

    dialogService.cancelar();

    const resultado = await promesa;
    expect(resultado).toBe(false);
    expect(dialogService.estado.value.abierto).toBe(false);
  });

  it('abre un diálogo informativo de alerta en modo soloConfirmar', async () => {
    const promesa = dialogService.alerta('Mensaje de información del sistema');

    expect(dialogService.estado.value.abierto).toBe(true);
    expect(dialogService.estado.value.soloConfirmar).toBe(true);
    expect(dialogService.estado.value.textoConfirmar).toBe('ENTENDIDO');

    dialogService.aceptar();

    const resultado = await promesa;
    expect(resultado).toBe(true);
    expect(dialogService.estado.value.abierto).toBe(false);
  });
});
