const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    console.log('Electron Loaded');
});

window.shellExec = (command) => ipcRenderer.invoke('shell-exec', command);
window.selectFolder = () => ipcRenderer.invoke('select-folder');
window.readDatabase = (folderPath) => ipcRenderer.invoke('read-database', folderPath);
window.writeDatabase = (folderPath, data, fileName) => ipcRenderer.invoke('write-database', { folderPath, data, fileName });
