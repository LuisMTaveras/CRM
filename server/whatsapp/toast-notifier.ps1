
param(
    [string]$Titulo = "DEVFORGE CRM",
    [string]$Mensaje = "Mensaje nuevo de WhatsApp",
    [string]$Url = "http://localhost:5173/whatsapp"
)

try {
    # 1. Asegurar acceso directo en el Menú Inicio para registrar a "DEVFORGE CRM" como aplicación oficial en Windows
    $shortcutPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\DEVFORGE CRM.lnk"
    if (-not (Test-Path $shortcutPath)) {
        try {
            $wsh = New-Object -ComObject WScript.Shell
            $sc = $wsh.CreateShortcut($shortcutPath)
            $sc.TargetPath = "http://localhost:5173"
            $sc.Description = "DEVFORGE CRM Enterprise"
            $sc.Save()
        } catch {}
    }

    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

    $xmlStr = @"
<toast activationType="protocol" launch="$Url">
    <visual>
        <binding template="ToastGeneric">
            <text>$Titulo</text>
            <text>$Mensaje</text>
        </binding>
    </visual>
    <audio src="ms-winsoundevent:Notification.Default" />
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
