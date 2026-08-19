const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const fetch = require('cross-fetch');

// --- IPC Handlers ---

// Handle Database Setup/Reading
ipcMain.handle('read-database', async (event, folderPath) => {
    try {
        const defaultPath = path.join('C:', 'FixOrTrash');
        const targetFolder = folderPath || defaultPath;

        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, { recursive: true });
        }

        const dbFile = path.join(targetFolder, 'database.json');

        if (fs.existsSync(dbFile)) {
            const data = fs.readFileSync(dbFile, 'utf8');
            return JSON.parse(data);
        } else {
            return null; // Signals frontend to migrate data if needed
        }
    } catch (e) {
        console.error("Error reading DB:", e);
        return { error: e.message };
    }
});

// Handle Database Writing (supports optional custom fileName for backups)
ipcMain.handle('write-database', async (event, { folderPath, data, fileName }) => {
    try {
        const defaultPath = path.join('C:', 'FixOrTrash');
        const targetFolder = folderPath || defaultPath;

        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, { recursive: true });
        }

        const name = fileName || 'database.json';
        const dbFile = path.join(targetFolder, name);
        fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
        return { success: true };
    } catch (e) {
        console.error("Error writing DB:", e);
        return { error: e.message };
    }
});

// Handle Dialog for Folder Selection
ipcMain.handle('select-folder', async (event) => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    if (result.canceled) {
        return null;
    } else {
        return result.filePaths[0]; // Returns absolute path
    }
});

// Handle Shell Execution (ADB)
ipcMain.handle('shell-exec', async (event, command) => {
    return new Promise((resolve) => {
        let adbPath = 'adb'; // Default to global
        const debugInfo = {
            triedPaths: [],
            finalPath: 'global adb',
            found: false
        };

        if (command.startsWith('adb')) {
            const isDev = !app.isPackaged;

            // Potential paths for ADB
            const possiblePaths = [
                // 1. Dev Mode
                path.join(__dirname, '../resources/platform-tools/adb.exe'),
                // 2. Production (Standard Resources)
                path.join(process.resourcesPath, 'platform-tools/adb.exe'),
                // 2b. Production (Nested Resources - Fix for v16.14)
                path.join(process.resourcesPath, 'resources/platform-tools/adb.exe'),
                // 3. Portable (Adjacent to Executable)
                path.join(path.dirname(app.getPath('exe')), 'resources/platform-tools/adb.exe'),
                // 4. Portable (Inside internal resources if unpacked differently)
                path.join(path.dirname(app.getPath('exe')), 'resources/app/resources/platform-tools/adb.exe')
            ];

            for (const p of possiblePaths) {
                const exists = fs.existsSync(p);
                debugInfo.triedPaths.push({ path: p, exists });
                if (exists && !debugInfo.found) {
                    adbPath = `"${p}"`;
                    debugInfo.finalPath = p;
                    debugInfo.found = true;
                    // Replace 'adb' with the full path
                    command = command.replace(/^adb/, adbPath);
                }
            }
        }

        exec(command, (error, stdout, stderr) => {
            resolve({
                // Ensure strings to prevent "undefined" crashes
                stdout: stdout || '',
                stderr: stderr || '',
                error: error ? error.message : null,
                debugInfo // Send back debug info
            });
        });
    });
});

// Handle Ad-Blocked Window Creation
ipcMain.handle('open-adblocked-window', async (event, url, scriptToInject) => {
    try {
        const adblockWin = new BrowserWindow({
            width: 1000,
            height: 800,
            show: false, // Don't show until ready
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true
            },
            title: "Verifica IMEI (Protetta da AdBlock)",
            autoHideMenuBar: true
        });

        // Spoof Standard User-Agent to prevent Cloudflare/Anti-Bot blocks typical for Electron
        adblockWin.webContents.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

        try {
            // Initialize AdBlocker
            const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
            blocker.enableBlockingInSession(adblockWin.webContents.session);
        } catch (blockerErr) {
            console.error("AdBlocker init failed, proceeding without it:", blockerErr);
        }

        adblockWin.loadURL(url);

        if (scriptToInject) {
            adblockWin.webContents.on('did-finish-load', () => {
                adblockWin.webContents.executeJavaScript(scriptToInject).catch(err => console.error("Injection Javascript Error:", err));
            });
        }

        adblockWin.once('ready-to-show', () => {
            adblockWin.show();
        });

        return { success: true };
    } catch (error) {
        console.error("AdBlock Window Error:", error);
        return { success: false, error: error.message };
    }
});

// Handle Auto-Identify Model
ipcMain.handle('auto-identify-model', async (event, modelCode) => {
    return new Promise(async (resolve) => {
        let scraperWin = null;
        try {
            scraperWin = new BrowserWindow({
                width: 800,
                height: 600,
                show: false, // Hidden window
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    sandbox: true
                }
            });

            // Spoof UA to avoid bot detection
            scraperWin.webContents.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

            // Add AdBlocker to speed up page load and prevent interruptions
            try {
                const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
                blocker.enableBlockingInSession(scraperWin.webContents.session);
            } catch (blockerErr) {
                console.error("AdBlocker init failed for scraper:", blockerErr);
            }

            const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(modelCode + ' specs')}`;
            
            scraperWin.webContents.on('did-finish-load', async () => {
                try {
                    // Extract the first meaningful result title using DuckDuckGo HTML version
                    const result = await scraperWin.webContents.executeJavaScript(`
                        (() => {
                            const links = document.querySelectorAll('.result__a');
                            if (links.length > 0) {
                                // Clean up common suffixes like " - Full phone specifications", " - Specs", etc.
                                let title = links[0].innerText;
                                title = title.replace(/\\s*[-|]\\s*(Full phone specifications|Specs|Specifications|Review).*$/i, '');
                                title = title.replace(/\\s*[-|]\\s*GSMArena\\.com.*$/i, '');
                                title = title.replace(/\\s*[-|]\\s*PhoneDB.*$/i, '');
                                return title.trim();
                            }
                            return null;
                        })();
                    `);
                    
                    if (scraperWin) scraperWin.destroy();
                    resolve({ success: true, modelName: result || "Modello non trovato" });
                } catch (err) {
                    if (scraperWin) scraperWin.destroy();
                    resolve({ success: false, error: "Errore durante l'estrazione: " + err.message });
                }
            });

            // Set a timeout of 15 seconds to prevent hanging
            setTimeout(() => {
                if (scraperWin && !scraperWin.isDestroyed()) {
                    scraperWin.destroy();
                    resolve({ success: false, error: "Timeout della ricerca." });
                }
            }, 15000);

            await scraperWin.loadURL(searchUrl);

        } catch (error) {
            if (scraperWin && !scraperWin.isDestroyed()) scraperWin.destroy();
            resolve({ success: false, error: error.message });
        }
    });
});

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: true,
            contextIsolation: false, // Simplifying for local access instructions
            webSecurity: false, // For local file loading
            webviewTag: true
        },
        titleBarStyle: 'hidden', // Custom title bar
        titleBarOverlay: {
            color: '#0a0a0a',
            symbolColor: '#ffffff',
            height: 40
        },
        icon: path.join(__dirname, '../correct_icon.ico')
    });

    // In dev, load vite server. In prod, load index.html
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
        win.loadURL('http://localhost:5173');
        win.webContents.openDevTools({ mode: 'detach' });
    } else {
        win.loadFile(path.join(__dirname, '../dist-react/index.html'));
        // DevTools removed for production
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
