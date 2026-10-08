import { ref } from 'vue';

export type TipoDialogo = 'peligro' | 'advertencia' | 'info' | 'exito' | 'primario';

export interface OpcionesDialogo {
  titulo: string;
  subtitulo?: string;
  mensaje: string;
  detalle?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  tipo?: TipoDialogo;
  soloConfirmar?: boolean;
}

export interface EstadoDialogo extends OpcionesDialogo {
  abierto: boolean;
  resolve?: (valor: boolean) => void;
}

const estadoInicial: EstadoDialogo = {
  abierto: false,
  titulo: '',
  subtitulo: '',
  mensaje: '',
  detalle: '',
  textoConfirmar: 'ACEPTAR',
  textoCancelar: 'CANCELAR',
  tipo: 'peligro',
  soloConfirmar: false,
};

const estado = ref<EstadoDialogo>({ ...estadoInicial });

export const dialogService = {
  estado,

  /**
   * Muestra un modal de confirmación con promesa asíncrona.
   * Resuelve true si el usuario presiona confirmar, false si cancela o cierra.
   */
  confirmar(opciones: OpcionesDialogo): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      estado.value = {
        abierto: true,
        titulo: opciones.titulo,
        subtitulo: opciones.subtitulo || '',
        mensaje: opciones.mensaje,
        detalle: opciones.detalle || '',
        textoConfirmar: opciones.textoConfirmar || 'CONFIRMAR',
        textoCancelar: opciones.textoCancelar || 'CANCELAR',
        tipo: opciones.tipo || 'peligro',
        soloConfirmar: false,
        resolve,
      };
    });
  },

  /**
   * Muestra un modal informativo de alerta con un solo botón de acción.
   */
  alerta(opciones: OpcionesDialogo | string): Promise<boolean> {
    const opts: OpcionesDialogo =
      typeof opciones === 'string'
        ? {
            titulo: 'ATENCIÓN',
            subtitulo: 'MENSAJE DEL SISTEMA',
            mensaje: opciones,
            tipo: 'info',
          }
        : opciones;

    return new Promise<boolean>((resolve) => {
      estado.value = {
        abierto: true,
        titulo: opts.titulo,
        subtitulo: opts.subtitulo || 'INFORMACIÓN DEL SISTEMA',
        mensaje: opts.mensaje,
        detalle: opts.detalle || '',
        textoConfirmar: opts.textoConfirmar || 'ENTENDIDO',
        textoCancelar: '',
        tipo: opts.tipo || 'info',
        soloConfirmar: true,
        resolve,
      };
    });
  },

  /**
   * Resuelve la promesa y cierra el diálogo.
   */
  responder(confirmado: boolean) {
    if (estado.value.resolve) {
      estado.value.resolve(confirmado);
    }
    estado.value.abierto = false;
    estado.value.resolve = undefined;
  },

  cancelar() {
    this.responder(false);
  },

  aceptar() {
    this.responder(true);
  },
};
