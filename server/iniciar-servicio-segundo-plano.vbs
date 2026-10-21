' ==============================================================================
' DEVFORGE CRM — Iniciar Servidor en Segundo Plano (Sin Ventana de Consola)
' Ejecuta el servidor unificado (Node.js email-server.js) de forma 100% invisible.
' ==============================================================================

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Directorio del script y comando de ejecución
strScriptDir = objFSO.GetParentFolderName(WScript.ScriptFullName)
strCwd = objFSO.GetParentFolderName(strScriptDir)

' Ejecutar Node.js de forma totalmente oculta (0 = Oculto, False = No bloquear)
objShell.CurrentDirectory = strCwd
objShell.Run "cmd.exe /c node server\email-server.js", 0, False
