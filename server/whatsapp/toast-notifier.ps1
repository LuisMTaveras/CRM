param(
    [string]$Titulo = "DEVFORGE CRM",
    [string]$Mensaje = "Mensaje nuevo de WhatsApp",
    [string]$Url = "http://localhost:3000/whatsapp",
    [string]$Tipo = "general"
)

try {
    # 1. Reproducir sonido físico de alto impacto en los altavoces de Windows
    try {
        $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
        $serverDir = Split-Path -Parent $scriptDir
        $soundsDir = Join-Path $serverDir "data\sounds"

        $wav = if ($Tipo -eq "email" -or $Tipo -eq "correo") {
            Join-Path $soundsDir "correo-notificacion.wav"
        } else {
            Join-Path $soundsDir "whatsapp-notificacion.wav"
        }

        # Si no existiera en data/sounds, recurrir a Windows Media como respaldo
        if (-not (Test-Path $wav)) {
            $wav = if ($Tipo -eq "email" -or $Tipo -eq "correo") {
                "C:\Windows\Media\Windows Notify Email.wav"
            } else {
                "C:\Windows\Media\Windows Notify Messaging.wav"
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

    # 2. Asegurar acceso directo en el Menú Inicio para registrar a "DEVFORGE CRM" con el puerto correcto
    $shortcutPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\DEVFORGE CRM.lnk"
    try {
        $wsh = New-Object -ComObject WScript.Shell
        $sc = $wsh.CreateShortcut($shortcutPath)
        $sc.TargetPath = "$Url"
        $sc.Description = "DEVFORGE CRM Enterprise"
        $sc.Save()
    } catch {}

    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

    $soundEvent = if ($Tipo -eq "email" -or $Tipo -eq "correo") { "Notification.Mail" } else { "Notification.IM" }

    $xmlStr = @"
<toast activationType="protocol" launch="$Url">
    <visual>
        <binding template="ToastGeneric">
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
