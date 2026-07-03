const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

// Load environment variables from .github_token
const tokenPath = path.join(__dirname, '..', '.github_token');
if (!fs.existsSync(tokenPath)) {
    console.error("Error: .github_token file not found at " + tokenPath);
    process.exit(1);
}

const envContent = fs.readFileSync(tokenPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const GITHUB_TOKEN = env.GITHUB_TOKEN;
const GITHUB_OWNER = env.GITHUB_OWNER;
const GITHUB_REPO = env.GITHUB_REPO;
const TAURI_PRIVATE_KEY = env.TAURI_PRIVATE_KEY;

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !TAURI_PRIVATE_KEY) {
    console.error("Error: Missing GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, or TAURI_PRIVATE_KEY in .github_token!");
    process.exit(1);
}

// REST API Helper
function apiCall({ method, path: apiPath, host = 'api.github.com', headers = {}, body }) {
    return new Promise((resolve, reject) => {
        const options = {
            method,
            host,
            path: apiPath,
            headers: {
                'User-Agent': 'Tauri-Updater-Builder',
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                ...headers
            }
        };
        
        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ statusCode: res.statusCode, body: responseData });
                } else {
                    reject(new Error(`API Call failed with status ${res.statusCode}: ${responseData}`));
                }
            });
        });
        
        req.on('error', reject);
        if (body) {
            req.write(body);
        }
        req.end();
    });
}

async function run() {
    try {
        console.log("=== 1. Lettura versione attuale ===");
        const packageJsonPath = path.join(__dirname, '..', 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const oldVersion = packageJson.version;
        
        const parts = oldVersion.split('.').map(Number);
        parts[1] += 1; // Bumps minor version: 18.2.0 -> 18.3.0
        parts[2] = 0;
        const newVersion = parts.join('.');
        console.log(`Incremento versione: v${oldVersion} -> v${newVersion}`);

        console.log("=== 2. Aggiornamento file di configurazione ===");
        // package.json
        packageJson.version = newVersion;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');

        // tauri.conf.json
        const tauriConfPath = path.join(__dirname, '..', 'src-tauri', 'tauri.conf.json');
        const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
        tauriConf.version = newVersion;
        fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2), 'utf8');

        // Cargo.toml
        const cargoPath = path.join(__dirname, '..', 'src-tauri', 'Cargo.toml');
        let cargo = fs.readFileSync(cargoPath, 'utf8');
        cargo = cargo.replace(/version = "[^"]+"/, `version = "${newVersion}"`);
        fs.writeFileSync(cargoPath, cargo, 'utf8');
        console.log("File di configurazione aggiornati con successo.");

        console.log("=== 3. Compilazione dell'applicazione (Tauri) ===");
        console.log("Impostazione chiave privata per la firma digitale...");
        process.env.TAURI_SIGNING_PRIVATE_KEY = TAURI_PRIVATE_KEY;
        process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "";

        console.log("Esecuzione npm run build...");
        execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

        console.log("Esecuzione npx tauri build...");
        execSync('npx tauri build', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
        console.log("Compilazione completata con successo!");

        // Locate bundles
        const nsisName = `FixOrTrashPro_${newVersion}_x64-setup.exe`;
        const nsisSigName = `${nsisName}.sig`;
        
        const bundleDir = path.join(__dirname, '..', 'src-tauri', 'target', 'release', 'bundle', 'nsis');
        const installerPath = path.join(bundleDir, nsisName);
        const sigPath = path.join(bundleDir, nsisSigName);

        if (!fs.existsSync(installerPath) || !fs.existsSync(sigPath)) {
            throw new Error(`Errore: Impossibile trovare i file compilati a: \n${installerPath} o \n${sigPath}`);
        }

        const signatureText = fs.readFileSync(sigPath, 'utf8').trim();
        console.log("Firma digitale letta con successo.");

        console.log("=== 4. Creazione Release su GitHub ===");
        const releaseBody = JSON.stringify({
            tag_name: `v${newVersion}`,
            target_commitish: 'main',
            name: `FixOrTrash Pro v${newVersion}`,
            body: `Aggiornamento automatico v${newVersion} - Rilascio di produzione.`,
            draft: false,
            prerelease: false
        });

        const releaseRes = await apiCall({
            method: 'POST',
            path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`,
            headers: { 'Content-Type': 'application/json' },
            body: releaseBody
        });

        const release = JSON.parse(releaseRes.body);
        const releaseId = release.id;
        console.log(`Release creata con successo! ID: ${releaseId}`);

        console.log("=== 5. Caricamento dell'Installer su GitHub Releases ===");
        const fileBuffer = fs.readFileSync(installerPath);
        await apiCall({
            method: 'POST',
            path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/${releaseId}/assets?name=${nsisName}`,
            host: 'uploads.github.com',
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': fileBuffer.length
            },
            body: fileBuffer
        });
        console.log("Installer caricato con successo.");

        console.log("=== 6. Caricamento file firma .sig su GitHub Releases ===");
        const sigBuffer = fs.readFileSync(sigPath);
        await apiCall({
            method: 'POST',
            path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/${releaseId}/assets?name=${nsisSigName}`,
            host: 'uploads.github.com',
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': sigBuffer.length
            },
            body: sigBuffer
        });
        console.log("Firma digitale caricata con successo.");

        console.log("=== 7. Generazione e caricamento di updater.json ===");
        const updaterContent = {
            version: newVersion,
            notes: `Aggiornamento automatico v${newVersion}`,
            pub_date: new Date().toISOString(),
            platforms: {
                "windows-x86_64": {
                    signature: signatureText,
                    url: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/v${newVersion}/${nsisName}`
                }
            }
        };

        const updaterJsonStr = JSON.stringify(updaterContent, null, 2);

        // Check if updater.json already exists in repo to get its SHA
        let existingSha = null;
        try {
            const fileRes = await apiCall({
                method: 'GET',
                path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/updater.json`
            });
            const fileData = JSON.parse(fileRes.body);
            existingSha = fileData.sha;
            console.log(`Trovato updater.json esistente su GitHub con SHA: ${existingSha}`);
        } catch (e) {
            console.log("updater.json non trovato nel repository, verrà creato per la prima volta.");
        }

        const commitBody = JSON.stringify({
            message: `Update updater.json for release v${newVersion}`,
            content: Buffer.from(updaterJsonStr).toString('base64'),
            sha: existingSha || undefined
        });

        await apiCall({
            method: 'PUT',
            path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/updater.json`,
            headers: { 'Content-Type': 'application/json' },
            body: commitBody
        });

        console.log("=== PROCESSO COMPLETATO CON SUCCESSO! ===");
        console.log(`L'aggiornamento automatico v${newVersion} è ora online ed attivo!`);

    } catch (error) {
        console.error("Errore durante la procedura di push:");
        console.error(error.message);
        process.exit(1);
    }
}

run();
