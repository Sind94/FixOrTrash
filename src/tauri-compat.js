import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import jsPDF from 'jspdf';

// 0. Intercept jsPDF output('bloburl') to directly invoke native Rust print/open
const originalOutput = jsPDF.prototype.output;
jsPDF.prototype.output = function(type, options) {
  if (type === 'bloburl') {
    console.log('[Tauri Interceptor] jsPDF.output("bloburl") intercepted');
    try {
      const dataUri = originalOutput.call(this, 'datauristring');
      const base64Data = dataUri.split(',')[1];
      invoke('open_pdf_data', { base64Data, filename: 'documento.pdf' })
        .catch(err => {
          console.error('[Tauri Interceptor] Rust open_pdf_data error:', err);
          alert('Errore di apertura PDF (Rust): ' + err);
        });
    } catch (err) {
      console.error('[Tauri Interceptor] Error generating base64:', err);
      alert('Errore di generazione base64 PDF: ' + err);
    }
    return 'blob:handled_by_rust';
  }
  return originalOutput.apply(this, arguments);
};

// Helper to handle Blob PDFs (convert to base64, send to Rust for saving, opening, or previewing)
async function handleBlobPdf(blobUrl, filename, action) {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          if (action === 'save') {
            console.log('[Tauri Compat] Saving PDF via Rust:', filename);
            const res = await invoke('save_pdf_data', { base64Data, filename });
            resolve(res);
          } else if (action === 'open') {
            console.log('[Tauri Compat] Opening PDF via Rust:', filename);
            const res = await invoke('open_pdf_data', { base64Data, filename });
            resolve(res);
          } else if (action === 'preview') {
            console.log('[Tauri Compat] Generating temp preview path via Rust');
            const filePath = await invoke('get_preview_pdf_path', { base64Data });
            const assetUrl = convertFileSrc(filePath);
            console.log('[Tauri Compat] Converted asset URL for iframe:', assetUrl);
            resolve(assetUrl);
          }
        } catch (err) {
          console.error('[Tauri Compat] Error in handleBlobPdf invoke:', err);
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('[Tauri Compat] Failed to handle blob PDF:', err);
    throw err;
  }
}

// 1. Intercept window.open for blob URLs
const originalWindowOpen = window.open;
window.open = function(url, target, features) {
  const urlStr = url && typeof url === 'object' && url.toString ? url.toString() : url;
  if (urlStr === 'blob:handled_by_rust') {
    console.log('[Tauri Compat] Intercepted window.open (already handled by Rust)');
    return null;
  }
  if (typeof urlStr === 'string' && urlStr.startsWith('blob:')) {
    console.log('[Tauri Compat] Intercepted window.open with blob URL:', urlStr);
    handleBlobPdf(urlStr, 'documento.pdf', 'open')
      .catch(err => {
        console.error('[Tauri Compat] window.open blob error:', err);
        alert('Errore di apertura PDF (Blob Interceptor): ' + err);
      });
    return null;
  }
  return originalWindowOpen.apply(this, arguments);
};

// 2. Intercept HTMLAnchorElement.click for blob downloads
const originalClick = HTMLAnchorElement.prototype.click;
HTMLAnchorElement.prototype.click = function() {
  if (this.href && this.href.startsWith('blob:') && this.download) {
    console.log('[Tauri Compat] Intercepted anchor click download:', this.download);
    handleBlobPdf(this.href, this.download, 'save')
      .catch(err => console.error('[Tauri Compat] anchor download error:', err));
    return;
  }
  return originalClick.apply(this, arguments);
};

// 3. Intercept HTMLIFrameElement src property setter for blob previews
const originalIframeSrcDesc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
if (originalIframeSrcDesc && originalIframeSrcDesc.set) {
  Object.defineProperty(HTMLIFrameElement.prototype, 'src', {
    get: function() {
      return originalIframeSrcDesc.get.call(this);
    },
    set: function(value) {
      if (typeof value === 'string' && value.startsWith('blob:')) {
        const self = this;
        console.log('[Tauri Compat] Intercepted iframe src set to blob:', value);
        // Clear iframe to prevent loading error
        originalIframeSrcDesc.set.call(self, 'about:blank');
        // Fetch, write to disk, and load as local asset
        handleBlobPdf(value, 'preview.pdf', 'preview')
          .then((assetUrl) => {
            originalIframeSrcDesc.set.call(self, assetUrl);
          })
          .catch(err => console.error('[Tauri Compat] iframe src load error:', err));
        return;
      }
      originalIframeSrcDesc.set.call(this, value);
    }
  });
}

// Expose Electron compatibility
window.require = (moduleName) => {
  if (moduleName === 'electron') {
    return {
      ipcRenderer: {
        invoke: async (channel, ...args) => {
          console.log(`[Tauri Compat] ipcRenderer.invoke called on channel: ${channel}`, args);
          if (channel === 'open-adblocked-window') {
            return await invoke('open_adblocked_window', { url: args[0], script: args[1] });
          }
          if (channel === 'auto-identify-model') {
            return await invoke('auto_identify_model', { modelCode: args[0] });
          }
          if (channel === 'read-database') {
            return await invoke('read_database', { folderPath: args[0] });
          }
          if (channel === 'write-database') {
            const payload = args[0] || {};
            return await invoke('write_database', {
              folderPath: payload.folderPath,
              data: payload.data,
              fileName: payload.fileName
            });
          }
          if (channel === 'select-folder') {
            return await invoke('select_folder');
          }
          if (channel === 'shell-exec') {
            return await invoke('shell_exec', { command: args[0] });
          }
          if (channel === 'fetch-html') {
            return await invoke('fetch_html', { url: args[0] });
          }
          console.warn(`[Tauri Compat] Unknown IPC channel: ${channel}`);
          throw new Error(`IPC channel ${channel} not mocked in Tauri polyfill`);
        }
      },
      shell: {
        openExternal: async (url) => {
          console.log(`[Tauri Compat] shell.openExternal called for: ${url}`);
          return await invoke('open_external', { url });
        }
      }
    };
  }
  console.warn(`[Tauri Compat] Unknown module require: ${moduleName}`);
  throw new Error(`Module ${moduleName} not found in Tauri require mock`);
};

window.readDatabase = async (folderPath) => {
  console.log(`[Tauri Compat] window.readDatabase called for: ${folderPath}`);
  return await invoke('read_database', { folderPath });
};

window.writeDatabase = async (folderPath, data, fileName) => {
  console.log(`[Tauri Compat] window.writeDatabase called for: ${folderPath}, file: ${fileName}`);
  return await invoke('write_database', { folderPath, data, fileName });
};

window.selectFolder = async () => {
  console.log(`[Tauri Compat] window.selectFolder called`);
  return await invoke('select_folder');
};

window.shellExec = async (command) => {
  console.log(`[Tauri Compat] window.shellExec called for: ${command}`);
  return await invoke('shell_exec', { command });
};

console.log('[Tauri Compat] Electron/Tauri compatibility layer initialized');
