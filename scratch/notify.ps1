
param(
    [string]$Titulo = "DEVFORGE CRM",
    [string]$Mensaje = "Mensaje nuevo de WhatsApp"
)

try {
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

    $xmlStr = @"
<toast>
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
    
    # Usar el AppId de PowerShell o Edge para que Windows autorice el Toast
    $appId = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe'
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($toast)
    Write-Output "OK"
} catch {
    Write-Error $_.Exception.Message
}
