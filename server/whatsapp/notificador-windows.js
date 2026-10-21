/**
 * Notificador Nativo de Windows para DEVFORGE CRM
 * Emite notificaciones Toast en el escritorio de Windows con sonido real,
 * logotipo oficial de DEVFORGE CRM y redirección al puerto 3000.
 */

import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCRIPT_PATH = path.join(__dirname, 'toast-notifier.ps1');

const PUERTO_FRONTEND = process.env.VITE_PORT || process.env.FRONTEND_PORT || 3000;
const BASE_URL_APP = `http://localhost:${PUERTO_FRONTEND}`;

const SCRIPT_CONTENT = `
param(
    [string]$Titulo = "DEVFORGE CRM",
    [string]$Mensaje = "Mensaje nuevo de WhatsApp",
    [string]$Url = "http://localhost:3000/whatsapp",
    [string]$Tipo = "general"
)

try {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $serverDir = Split-Path -Parent $scriptDir
    $soundsDir = Join-Path $serverDir "data\\sounds"
    $logoPath = Join-Path $serverDir "data\\crm-logo.jpg"

    # 1. Reproducir sonido físico de alto impacto en los altavoces de Windows
    try {
        $wav = if ($Tipo -eq "email" -or $Tipo -eq "correo") {
            Join-Path $soundsDir "correo-notificacion.wav"
        } else {
            Join-Path $soundsDir "whatsapp-notificacion.wav"
        }

        # Si no existiera en data/sounds, recurrir a Windows Media como respaldo
        if (-not (Test-Path $wav)) {
            $wav = if ($Tipo -eq "email" -or $Tipo -eq "correo") {
                "C:\\Windows\\Media\\Windows Notify Email.wav"
            } else {
                "C:\\Windows\\Media\\Windows Notify Messaging.wav"
            }
        }

        if (Test-Path $wav) {
            $player = New-Object System.Media.SoundPlayer $wav
            $player.Play()
        } else {
            [System.Media.SystemSounds]::Asterisk.Play()
        }
    } catch {
        try { [System.Media.SystemSounds]::Asterisk.Play() } catch {}
    }

    # 2. Asegurar acceso directo en el Menú Inicio para registrar a "DEVFORGE CRM" con el puerto correcto y logotipo
    $shortcutPath = "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\DEVFORGE CRM.lnk"
    try {
        $wsh = New-Object -ComObject WScript.Shell
        $sc = $wsh.CreateShortcut($shortcutPath)
        $sc.TargetPath = "$Url"
        $sc.Description = "DEVFORGE CRM Enterprise"
        if (Test-Path $logoPath) {
            $sc.IconLocation = "$logoPath,0"
        }
        $sc.Save()
    } catch {}

    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

    $soundEvent = if ($Tipo -eq "email" -or $Tipo -eq "correo") { "Notification.Mail" } else { "Notification.IM" }
    $imageTag = if (Test-Path $logoPath) { "<image placement=""appLogoOverride"" hint-crop=""circle"" src=""$logoPath"" />" } else { "" }

    $xmlStr = @"
<toast activationType="protocol" launch="$Url">
    <visual>
        <binding template="ToastGeneric">
            $imageTag
            <text>$Titulo</text>
            <text>$Mensaje</text>
        </binding>
    </visual>
    <audio src="ms-winsoundevent:$soundEvent" />
</toast>
"@

    $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
    $xml.LoadXml($xmlStr)
    $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)

    # Identificar la notificación con la marca propia "DEVFORGE CRM"
    try {
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("DEVFORGE CRM").Show($toast)
    } catch {
        try {
            # Fallback a Microsoft Edge / Navegador
            [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Microsoft.MicrosoftEdge.Stable_8wekyb3d8bbwe!App").Show($toast)
        } catch {}
    }
} catch {}
`;

try {
  fs.writeFileSync(SCRIPT_PATH, SCRIPT_CONTENT, 'utf8');
} catch {}

/**
 * Emite una notificación nativa de Windows en el escritorio con sonido e icono
 * @param {string} titulo - Título de la notificación
 * @param {string} mensaje - Cuerpo del mensaje
 * @param {string} url - URL para abrir al hacer clic (puerto 3000)
 * @param {string} tipo - Tipo de alerta: 'email' | 'whatsapp' | 'general'
 */
export function notificarEscritorioWindows(
  titulo,
  mensaje,
  url = `${BASE_URL_APP}/comunicaciones`,
  tipo = 'general'
) {
  if (process.platform !== 'win32') return;

  try {
    // Si la URL contenía el puerto 5173 por error, corregirla automáticamente al puerto 3000 de Vite
    const urlCorregida = String(url).replace(':5173', `:${PUERTO_FRONTEND}`);

    if (!fs.existsSync(SCRIPT_PATH)) {
      fs.writeFileSync(SCRIPT_PATH, SCRIPT_CONTENT, 'utf8');
    }

    execFile(
      'powershell.exe',
      [
        '-NoProfile',
        '-WindowStyle',
        'Hidden',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        SCRIPT_PATH,
        String(titulo || 'DEVFORGE CRM'),
        String(mensaje || 'Nuevo aviso comercial'),
        String(urlCorregida),
        String(tipo || 'general'),
      ],
      { timeout: 6000 },
      () => {}
    );
  } catch {}
}
