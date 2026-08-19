const fs = require('fs');
const path = require('path');
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

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    console.error("Error: Missing credentials in .github_token!");
    process.exit(1);
}

function apiCall({ method, path: apiPath, host = 'api.github.com', headers = {}, body }) {
    return new Promise((resolve, reject) => {
        const options = {
            method,
            host,
            path: apiPath,
            headers: {
                'User-Agent': 'Tauri-Code-Pusher',
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

function getAllFiles(dirPath, arrayOfFiles = [], baseDir = dirPath) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

        // Ignore unwanted dirs/files
        if (
            relPath.startsWith('node_modules') ||
            relPath.startsWith('dist-react') ||
            relPath.startsWith('src-tauri/target') ||
            relPath.startsWith('.git') ||
            relPath.startsWith('.agents') ||
            relPath.startsWith('scratch') ||
            relPath.startsWith('APK') ||
            file === '.github_token' ||
            file.endsWith('.exe') ||
            file.endsWith('.msi') ||
            file.endsWith('.pdf') ||
            file.endsWith('.sig')
        ) {
            return;
        }

        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, arrayOfFiles, baseDir);
        } else {
            arrayOfFiles.push({ fullPath, relPath });
        }
    });

    return arrayOfFiles;
}

async function run() {
    try {
        console.log("=== 1. Recupero ultimo commit del branch main ===");
        const refRes = await apiCall({
            method: 'GET',
            path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/main`
        });
        const latestCommitSha = JSON.parse(refRes.body).object.sha;
        console.log(`Ultimo commit SHA: ${latestCommitSha}`);

        const commitRes = await apiCall({
            method: 'GET',
            path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits/${latestCommitSha}`
        });
        const baseTreeSha = JSON.parse(commitRes.body).tree.sha;

        console.log("=== 2. Creazione Blobs per i file sorgenti ===");
        const rootDir = path.join(__dirname, '..');
        const filesToPush = getAllFiles(rootDir);
        console.log(`Trovati ${filesToPush.length} file di codice sorgente da sincronizzare.`);

        const treeItems = [];
        for (let i = 0; i < filesToPush.length; i++) {
            const f = filesToPush[i];
            const content = fs.readFileSync(f.fullPath);
            const isBinary = !/\.(js|jsx|json|html|css|toml|md|cjs|txt|svg)$/i.test(f.relPath);

            const blobBody = JSON.stringify({
                content: content.toString(isBinary ? 'base64' : 'utf8'),
                encoding: isBinary ? 'base64' : 'utf-8'
            });

            const blobRes = await apiCall({
                method: 'POST',
                path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/blobs`,
                headers: { 'Content-Type': 'application/json' },
                body: blobBody
            });

            const blobSha = JSON.parse(blobRes.body).sha;
            treeItems.push({
                path: f.relPath,
                mode: '100644',
                type: 'blob',
                sha: blobSha
            });
        }

        console.log("=== 3. Creazione Tree Git ===");
        const treeRes = await apiCall({
            method: 'POST',
            path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees`,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                base_tree: baseTreeSha,
                tree: treeItems
            })
        });
        const newTreeSha = JSON.parse(treeRes.body).sha;

        console.log("=== 4. Creazione Commit ===");
        const newCommitRes = await apiCall({
            method: 'POST',
            path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits`,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Aggiornamento v18.21.0 - Nuove feature (Draft memoria, Appunti blocco, Updater diretto, Temi Light, Modifica & Diagnosi CheckIn)`,
                tree: newTreeSha,
                parents: [latestCommitSha]
            })
        });
        const newCommitSha = JSON.parse(newCommitRes.body).sha;

        console.log("=== 5. Aggiornamento branch main (Push) ===");
        await apiCall({
            method: 'PATCH',
            path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/main`,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sha: newCommitSha,
                force: false
            })
        });

        console.log("=== CODICE PUSHATO CON SUCCESSO SU GITHUB (branch main)! ===");
        console.log(`Commit SHA: ${newCommitSha}`);
    } catch (e) {
        console.error("Errore durante il push:", e);
        process.exit(1);
    }
}

run();
