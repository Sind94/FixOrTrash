import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logoReport from '../assets/logo_denis.jpg';
import { dataManager } from './dataManager';

// Hex to RGB helper
const hexToRgb = (hex) => {
    if (!hex || hex[0] !== '#') return { r: 40, g: 40, b: 40 };
    let c = hex.substring(1);
    if (c.length === 3) {
        c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    const num = parseInt(c, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
};

// Variable Replacer Helper
const replacePlaceholders = (text, context) => {
    if (!text) return '';
    let result = text;
    
    const store = context.store || {};
    const ticket = context.ticket || {};
    const customer = ticket.customer || context.customer || {};
    const device = ticket.device || context.device || {};
    const config = context.config || {};
    const purchase = context.purchase || {};

    const replacements = {
        '{{store.name}}': store.name || 'FIX OR TRASH',
        '{{store.phone}}': store.phone || '',
        '{{store.email}}': store.email || '',
        '{{store.address}}': store.address || '',
        '{{store.technician}}': store.technician || '',
        '{{store.terms}}': store.terms || '',
        '{{ticket.id}}': ticket.id || '',
        '{{ticket.date}}': ticket.date ? new Date(ticket.date).toLocaleString('it-IT') : '',
        '{{ticket.technician}}': ticket.technician || store.technician || '',
        '{{ticket.notes}}': ticket.notes || '',
        '{{ticket.defect}}': device.problem || ticket.defect || '',
        '{{customer.name}}': customer.name || '',
        '{{customer.phone}}': customer.phone || customer.contact || '',
        '{{customer.email}}': customer.email || '',
        '{{device.info}}': device.info || '',
        '{{device.imei}}': device.imei || '',
        '{{device.serial}}': device.serial || '',
        '{{device.defect}}': device.problem || device.defect || '',
        '{{current.date}}': new Date().toLocaleDateString('it-IT'),
        '{{config.useCase}}': config.useCase || '',
        '{{config.profile}}': config.profile || '',
        '{{config.softwares}}': config.softwares || '',
        '{{config.notes}}': config.notes || '',
        '{{purchase.id}}': purchase.id || ''
    };

    Object.keys(replacements).forEach(key => {
        result = result.split(key).join(replacements[key]);
    });

    return result;
};

// Default JSON Templates
export const DEFAULT_LAYOUTS = {
    checkin: [
        { id: 'logo', type: 'image', x: 14, y: 10, w: 22, h: 22, content: 'logo' },
        { id: 'store_name', type: 'text', x: 60, y: 18, fontSize: 18, fontWeight: 'bold', content: '{{store.name}}' },
        { id: 'store_contact', type: 'text', x: 60, y: 23, fontSize: 8.5, textColor: '#64748b', content: 'Email: {{store.email}} | Tel: {{store.phone}}' },
        { id: 'store_address', type: 'text', x: 60, y: 27, fontSize: 8.5, textColor: '#64748b', content: 'Indirizzo: {{store.address}}' },
        { id: 'ticket_id_date', type: 'text', x: 60, y: 34, fontSize: 8.5, textColor: '#64748b', content: 'ID Ticket: {{ticket.id}} | Data: {{ticket.date}}' },
        { id: 'ticket_tech', type: 'text', x: 60, y: 39, fontSize: 8.5, textColor: '#64748b', content: 'Tecnico Preposto: {{ticket.technician}}' },
        { id: 'table_customer', type: 'table', x: 14, y: 50, w: 182, tableType: 'customerInfo', headerBgColor: '#fdf8e1', headerTextColor: '#282828', altRowBgColor: '#f8fafc', fontSize: 10, cellPadding: 2.5 },
        { id: 'table_checklist', type: 'table', x: 14, y: 80, w: 182, tableType: 'checklist', headerBgColor: '#fdf8e1', headerTextColor: '#282828', altRowBgColor: '#f8fafc', fontSize: 8, cellPadding: 1.5 },
        { id: 'table_repair', type: 'table', x: 14, y: 140, w: 182, tableType: 'repairItems', headerBgColor: '#fdf8e1', headerTextColor: '#282828', altRowBgColor: '#f8fafc', fontSize: 9, cellPadding: 2 },
        { id: 'terms', type: 'text', x: 14, y: 215, w: 182, fontSize: 7, textColor: '#787878', content: '{{store.terms}}' },
        { id: 'tech_sig_line', type: 'line', x: 14, y: 265, w: 76, h: 0.5, textColor: '#969696' },
        { id: 'tech_sig_text', type: 'text', x: 14, y: 269, fontSize: 7, textColor: '#787878', content: 'Firma Tecnico' },
        { id: 'client_sig_line', type: 'line', x: 110, y: 265, w: 80, h: 0.5, textColor: '#969696' },
        { id: 'client_sig_text', type: 'text', x: 110, y: 269, fontSize: 7, textColor: '#787878', content: 'Firma Cliente' }
    ],
    checkout: [
        { id: 'logo', type: 'image', x: 14, y: 10, w: 22, h: 22, content: 'logo' },
        { id: 'store_name', type: 'text', x: 60, y: 18, fontSize: 18, fontWeight: 'bold', content: '{{store.name}}' },
        { id: 'store_contact', type: 'text', x: 60, y: 23, fontSize: 8.5, textColor: '#64748b', content: 'Email: {{store.email}} | Tel: {{store.phone}}' },
        { id: 'store_address', type: 'text', x: 60, y: 27, fontSize: 8.5, textColor: '#64748b', content: 'Indirizzo: {{store.address}}' },
        { id: 'doc_title', type: 'text', x: 145, y: 16, fontSize: 10, fontWeight: 'bold', content: 'RICEVUTA DI RITIRO' },
        { id: 'doc_date', type: 'text', x: 145, y: 22, fontSize: 7.5, textColor: '#64748b', content: 'Data: {{current.date}}' },
        { id: 'ticket_id_date', type: 'text', x: 14, y: 45, fontSize: 11, fontWeight: 'bold', content: 'Ritiro Scheda Intervento: #{{ticket.id}}' },
        { id: 'client_device_summary', type: 'text', x: 14, y: 52, fontSize: 9.5, textColor: '#505050', content: 'Cliente: {{customer.name}} | Tel: {{customer.phone}}\nDispositivo: {{device.info}} | Serial/IMEI: {{device.imei}}' },
        { id: 'table_checkout_checklist', type: 'table', x: 14, y: 68, w: 182, tableType: 'checkoutChecklist', headerBgColor: '#fdf8e1', headerTextColor: '#282828', altRowBgColor: '#f8fafc', fontSize: 8, cellPadding: 1.5 },
        { id: 'table_prices', type: 'table', x: 14, y: 150, w: 182, tableType: 'pricesSummary', headerBgColor: '#fdf8e1', headerTextColor: '#282828', altRowBgColor: '#f8fafc', fontSize: 9, cellPadding: 2 },
        { id: 'checkout_note', type: 'text', x: 14, y: 215, w: 182, fontSize: 8.5, textColor: '#969696', content: 'Documento generato dal software gestionale FixOrTrash Pro' },
        { id: 'terms', type: 'text', x: 14, y: 223, w: 182, fontSize: 6.2, textColor: '#787878', content: '{{store.terms}}' },
        { id: 'client_sig_line', type: 'line', x: 110, y: 265, w: 80, h: 0.5, textColor: '#969696' },
        { id: 'client_sig_text', type: 'text', x: 110, y: 269, fontSize: 7, textColor: '#787878', content: 'Firma Cliente per Ritiro & Accettazione Collaudo' }
    ],
    tester: [
        { id: 'logo', type: 'image', x: 14, y: 10, w: 22, h: 22, content: 'logo' },
        { id: 'store_name', type: 'text', x: 45, y: 18, fontSize: 18, fontWeight: 'bold', content: '{{store.name}}' },
        { id: 'store_tech', type: 'text', x: 45, y: 24, fontSize: 8.5, textColor: '#64748b', content: 'Tecnico: {{store.technician}}' },
        { id: 'store_contact', type: 'text', x: 45, y: 28, fontSize: 8.5, textColor: '#64748b', content: 'Email: {{store.email}} | Tel: {{store.phone}}' },
        { id: 'doc_title_bg', type: 'rect', x: 145, y: 10, w: 50, h: 18, fillColor: '#eab308', borderColor: '#eab308' },
        { id: 'doc_title', type: 'text', x: 148, y: 16, fontSize: 10, fontWeight: 'bold', textColor: '#282828', content: 'REPORT COLLAUDO' },
        { id: 'doc_date', type: 'text', x: 148, y: 22, fontSize: 7.5, textColor: '#282828', content: 'Data: {{current.date}}' },
        { id: 'ticket_header', type: 'text', x: 14, y: 45, fontSize: 11, fontWeight: 'bold', content: 'Dettagli Scheda Riparazione: #{{ticket.id}}' },
        { id: 'ticket_details', type: 'text', x: 14, y: 52, fontSize: 9.5, textColor: '#505050', content: 'Cliente: {{customer.name}}\nTelefono: {{customer.phone}}\nDispositivo: {{device.info}}\nSeriale/IMEI: {{device.imei}}' },
        { id: 'table_tester_results', type: 'table', x: 14, y: 68, w: 182, tableType: 'testerResults', headerBgColor: '#eab308', headerTextColor: '#282828', altRowBgColor: '#f8fafc', fontSize: 8, cellPadding: 1.5 },
        { id: 'footer_note', type: 'text', x: 14, y: 235, w: 182, fontSize: 7, textColor: '#969696', content: 'Documento generato dal software gestionale FixOrTrash Pro' },
        { id: 'terms', type: 'text', x: 14, y: 241, w: 182, fontSize: 6.2, textColor: '#787878', content: '{{store.terms}}' }
    ],
    quote: [
        { id: 'logo', type: 'image', x: 14, y: 10, w: 22, h: 22, content: 'logo' },
        { id: 'store_name', type: 'text', x: 60, y: 18, fontSize: 18, fontWeight: 'bold', content: '{{store.name}}' },
        { id: 'store_contact', type: 'text', x: 60, y: 23, fontSize: 8.5, textColor: '#64748b', content: 'Email: {{store.email}} | Tel: {{store.phone}}' },
        { id: 'store_address', type: 'text', x: 60, y: 27, fontSize: 8.5, textColor: '#64748b', content: 'Indirizzo: {{store.address}}' },
        { id: 'doc_title', type: 'text', x: 145, y: 16, fontSize: 12, fontWeight: 'bold', content: 'PREVENTIVO RIPARAZIONE' },
        { id: 'doc_date', type: 'text', x: 145, y: 22, fontSize: 8.5, textColor: '#64748b', content: 'Data: {{current.date}}' },
        { id: 'client_details_header', type: 'text', x: 14, y: 45, fontSize: 11, fontWeight: 'bold', content: 'Dettagli Cliente & Dispositivo' },
        { id: 'client_details', type: 'text', x: 14, y: 52, fontSize: 9.5, textColor: '#505050', content: 'Cliente: {{customer.name}} | Tel: {{customer.phone}}\nDispositivo: {{device.info}} | IMEI/Seriale: {{device.imei}}\nDiagnosi: {{ticket.defect}}' },
        { id: 'table_quote_details', type: 'table', x: 14, y: 70, w: 182, tableType: 'quoteDetails', headerBgColor: '#fdf8e1', headerTextColor: '#282828', altRowBgColor: '#f8fafc', fontSize: 9, cellPadding: 2 },
        { id: 'terms_header', type: 'text', x: 14, y: 180, fontSize: 9, fontWeight: 'bold', content: 'Note e Validità del Preventivo' },
        { id: 'terms', type: 'text', x: 14, y: 186, w: 182, fontSize: 7, textColor: '#787878', content: 'Il presente preventivo ha una validità di 30 giorni dalla data di emissione. I prezzi indicati sono comprensivi di ricambi e manodopera. In caso di complicazioni durante la riparazione, il cliente verrà tempestivamente contattato prima di procedere.\n\nOperazione effettuata ai sensi dell\'art. 1, commi da 54 a 89, della Legge n. 190/2014 - Regime forfettario. Prestazione non soggetta a ritenuta d\'acconto.' },
        { id: 'client_sig_line', type: 'line', x: 110, y: 255, w: 80, h: 0.5, textColor: '#969696' },
        { id: 'client_sig_text', type: 'text', x: 110, y: 259, fontSize: 7, textColor: '#787878', content: 'Firma per Accettazione Preventivo' }
    ],
    pc_config: [
        { id: 'logo', type: 'image', x: 14, y: 10, w: 22, h: 22, content: 'logo' },
        { id: 'store_name', type: 'text', x: 60, y: 18, fontSize: 18, fontWeight: 'bold', content: '{{store.name}}' },
        { id: 'store_contact', type: 'text', x: 60, y: 23, fontSize: 8.5, textColor: '#64748b', content: 'Email: {{store.email}} | Tel: {{store.phone}}' },
        { id: 'store_address', type: 'text', x: 60, y: 27, fontSize: 8.5, textColor: '#64748b', content: 'Indirizzo: {{store.address}}' },
        { id: 'doc_title', type: 'text', x: 140, y: 16, fontSize: 12, fontWeight: 'bold', content: 'PREVENTIVO PC' },
        { id: 'doc_date', type: 'text', x: 140, y: 22, fontSize: 8.5, textColor: '#64748b', content: 'Data: {{current.date}}' },
        { id: 'config_details_header', type: 'text', x: 14, y: 45, fontSize: 11, fontWeight: 'bold', content: 'Dettagli Configurazione PC' },
        { id: 'config_details', type: 'text', x: 14, y: 52, fontSize: 9.5, textColor: '#505050', content: 'Destinazione d\'uso: {{config.useCase}} | Profilo: {{config.profile}}\nSoftware indicati: {{config.softwares}}\nNote: {{config.notes}}' },
        { id: 'table_pc_components', type: 'table', x: 14, y: 68, w: 182, tableType: 'pcComponents', headerBgColor: '#fdf8e1', headerTextColor: '#282828', altRowBgColor: '#f8fafc', fontSize: 8.5, cellPadding: 1.8 },
        { id: 'terms_header', type: 'text', x: 14, y: 195, fontSize: 9, fontWeight: 'bold', content: 'Termini di Garanzia e Consegna' },
        { id: 'terms', type: 'text', x: 14, y: 201, w: 182, fontSize: 7, textColor: '#787878', content: 'I singoli componenti godono della garanzia ufficiale del produttore (solitamente 24 mesi). Il servizio di assemblaggio e stress test comprende una garanzia di 12 mesi sul corretto assemblaggio. I tempi stimati di consegna sono di 5-7 giorni lavorativi dall\'approvazione e versamento dell\'acconto.' },
        { id: 'client_sig_line', type: 'line', x: 110, y: 255, w: 80, h: 0.5, textColor: '#969696' },
        { id: 'client_sig_text', type: 'text', x: 110, y: 259, fontSize: 7, textColor: '#787878', content: 'Firma per Ordine & Accettazione Componenti' }
    ],
    label: [
        { id: 'label_title', type: 'text', x: 4, y: 8, fontSize: 10, fontWeight: 'bold', content: '{{store.name}}' },
        { id: 'label_ticket_id', type: 'text', x: 44, y: 8, fontSize: 7, content: 'TICKET: #{{ticket.id}}' },
        { id: 'label_line', type: 'line', x: 4, y: 10, w: 72, h: 0.3, textColor: '#282828' },
        { id: 'label_customer_lbl', type: 'text', x: 4, y: 15, fontSize: 8.5, fontWeight: 'bold', content: 'CLIENTE:' },
        { id: 'label_customer_val', type: 'text', x: 20, y: 15, fontSize: 8.5, content: '{{customer.name}}' },
        { id: 'label_device_lbl', type: 'text', x: 4, y: 20, fontSize: 8.5, fontWeight: 'bold', content: 'DEVICE:' },
        { id: 'label_device_val', type: 'text', x: 20, y: 20, fontSize: 8.5, content: '{{device.info}}' },
        { id: 'label_defect_lbl', type: 'text', x: 4, y: 25, fontSize: 8.5, fontWeight: 'bold', content: 'DIFETTO:' },
        { id: 'label_defect_val', type: 'text', x: 20, y: 25, fontSize: 8.5, content: '{{device.defect}}' }
    ],
    purchase: [
        { id: 'logo', type: 'image', x: 14, y: 10, w: 22, h: 22, content: 'logo' },
        { id: 'store_name', type: 'text', x: 60, y: 18, fontSize: 18, fontWeight: 'bold', content: '{{store.name}}' },
        { id: 'store_contact', type: 'text', x: 60, y: 23, fontSize: 8.5, textColor: '#64748b', content: 'Email: {{store.email}} | Tel: {{store.phone}}' },
        { id: 'store_address', type: 'text', x: 60, y: 27, fontSize: 8.5, textColor: '#64748b', content: 'Indirizzo: {{store.address}}' },
        { id: 'doc_title', type: 'text', x: 145, y: 16, fontSize: 12, fontWeight: 'bold', content: 'RICEVUTA DI VENDITA' },
        { id: 'doc_date', type: 'text', x: 145, y: 22, fontSize: 8.5, textColor: '#64748b', content: 'Data: {{current.date}}' },
        { id: 'purchase_id', type: 'text', x: 14, y: 45, fontSize: 11, fontWeight: 'bold', content: 'Riepilogo Acquisto' },
        { id: 'client_details', type: 'text', x: 14, y: 52, fontSize: 9.5, textColor: '#505050', content: 'Cliente: {{customer.name}} | Tel: {{customer.phone}} | Email: {{customer.email}}' },
        { id: 'table_purchase_items', type: 'table', x: 14, y: 65, w: 182, tableType: 'purchaseItems', headerBgColor: '#fdf8e1', headerTextColor: '#282828', altRowBgColor: '#f8fafc', fontSize: 9, cellPadding: 2.5 },
        { id: 'table_purchase_totals', type: 'table', x: 120, y: 160, w: 76, tableType: 'purchaseTotals', headerBgColor: '#ffffff', headerTextColor: '#282828', altRowBgColor: '#ffffff', fontSize: 9, cellPadding: 1.8 },
        { id: 'terms', type: 'text', x: 14, y: 215, w: 182, fontSize: 7, textColor: '#787878', content: 'Grazie per il tuo acquisto! Per qualsiasi informazione o garanzia, presenta questa ricevuta in negozio.\n\nOperazione effettuata ai sensi dell\'art. 1, commi da 54 a 89, della Legge n. 190/2014 - Regime forfettario. Prestazione non soggetta a ritenuta.' }
    ]
};

// Retrieve Layout (saved or default)
export const getLayout = (templateId) => {
    const settings = dataManager.getSync('settings') || {};
    const layouts = settings.pdfLayouts || {};
    const layout = layouts[templateId] || DEFAULT_LAYOUTS[templateId];

    // Dynamic sanitization to remove receipt number suffix from the title
    if (templateId === 'purchase' && Array.isArray(layout)) {
        return layout.map(item => {
            if (item.id === 'purchase_id' && item.content && item.content.includes('#{{purchase.id}}')) {
                return { ...item, content: 'Riepilogo Acquisto' };
            }
            return item;
        });
    }

    return layout;
};

// Render Table Logic
const renderTable = (doc, item, dataContext, pdfStyle) => {
    const tableType = item.tableType;
    let head = [];
    let body = [];
    let styles = { fontSize: 8, cellPadding: 1.5 };
    let columnStyles = {};
    let startY = item.y;
    
    // Custom table styling based on global pdfStyle
    let headStyles = { 
        fillColor: pdfStyle === 'tech' ? [15, 23, 42] : (pdfStyle === 'emerald' ? [6, 78, 59] : [253, 248, 225]), 
        textColor: pdfStyle === 'classic' ? [40, 40, 40] : [255, 255, 255] 
    };

    if (tableType === 'customerInfo') {
        const ticket = dataContext.ticket || {};
        const lockInfoStr = (ticket.device?.lockType && ticket.device?.lockType !== 'none')
            ? (ticket.device.lockType === 'pin' ? `\nCodice Sblocco: ${ticket.device.lockCode}` : `\nSegno Sblocco: [${ticket.device.lockCode}]`)
            : '';
        head = [['Informazioni Cliente', 'Dispositivo & Guasto']];
        body = [[
            { content: `Cliente:\n${ticket.customer?.name || ''}\nTel: ${ticket.customer?.phone || ticket.customer?.contact || ''}\nEmail: ${ticket.customer?.email || ''}`, styles: { fontStyle: 'bold' } },
            { content: `Modello: ${ticket.device?.info || ''}\nIMEI/Seriale: ${ticket.device?.imei || 'N/A'}\nGuasto: ${ticket.device?.problem || ''}\nPriorità: ${(ticket.priority || 'medium').toUpperCase()}\nConsegna Prevista: ${ticket.dueDate || 'N/A'}${lockInfoStr}` }
        ]];
        styles = { fontSize: 10, cellPadding: 2.5 };
        headStyles.fillColor = pdfStyle === 'tech' ? [14, 165, 233] : (pdfStyle === 'emerald' ? [16, 185, 129] : [253, 248, 225]);
    } 
    else if (tableType === 'checklist') {
        const ticket = dataContext.ticket || {};
        const checklistItems = dataContext.checklistItems || {
            power: 'Tasto Accensione', screen: 'Schermo LCD', touch: 'Touch Screen',
            charging: 'Ricarica', cameras: 'Fotocamere', wifi: 'Wi-Fi / Connessione',
            audio: 'Audio / Altoparlanti', buttons: 'Tasti Volume', proximity: 'Sensore Prossimità',
            sim: 'Lettura SIM', biometrics: 'FaceID / Impronta'
        };
        const mapVal = (val) => {
            if (val === 'ok') return 'OK (Funzionante)';
            if (val === 'ko') return 'KO (Guasto)';
            return 'N.T. (Non Testabile)';
        };
        const keys = Object.keys(checklistItems);
        const checklistRows = [];
        for (let i = 0; i < keys.length; i += 2) {
            const key1 = keys[i];
            const key2 = keys[i + 1];
            checklistRows.push([
                checklistItems[key1],
                mapVal(ticket.checklist?.[key1] || 'nt'),
                key2 ? checklistItems[key2] : '',
                key2 ? mapVal(ticket.checklist?.[key2] || 'nt') : ''
            ]);
        }
        head = [['Componente', 'Stato (Ingresso)', 'Componente', 'Stato (Ingresso)']];
        body = checklistRows;
        styles = { fontSize: 8, cellPadding: 1.5 };
        headStyles.fillColor = pdfStyle === 'tech' ? [30, 41, 59] : (pdfStyle === 'emerald' ? [4, 120, 87] : [253, 248, 225]);
    }
    else if (tableType === 'checkoutChecklist') {
        const ticket = dataContext.ticket || {};
        const checklistItems = dataContext.checklistItems || {
            power: 'Tasto Accensione', screen: 'Schermo LCD', touch: 'Touch Screen',
            charging: 'Ricarica', cameras: 'Fotocamere', wifi: 'Wi-Fi / Connessione',
            audio: 'Audio / Altoparlanti', buttons: 'Tasti Volume', proximity: 'Sensore Prossimità',
            sim: 'Lettura SIM', biometrics: 'FaceID / Impronta'
        };
        const mapVal = (val) => {
            if (val === 'ok') return 'OK (PASSATO)';
            if (val === 'fail') return 'FALLITO';
            return 'N.T. (Non Testato)';
        };
        const keys = Object.keys(checklistItems);
        const checklistRows = [];
        for (let i = 0; i < keys.length; i += 2) {
            const key1 = keys[i];
            const key2 = keys[i + 1];
            checklistRows.push([
                checklistItems[key1],
                mapVal(ticket.testChecklist?.[key1] || 'nt'),
                key2 ? checklistItems[key2] : '',
                key2 ? mapVal(ticket.testChecklist?.[key2] || 'nt') : ''
            ]);
        }
        head = [['Componente', 'Stato Collaudo', 'Componente', 'Stato Collaudo']];
        body = checklistRows;
        styles = { fontSize: 8, cellPadding: 1.5 };
        headStyles.fillColor = pdfStyle === 'tech' ? [30, 41, 59] : (pdfStyle === 'emerald' ? [4, 120, 87] : [253, 248, 225]);
    }
    else if (tableType === 'repairItems') {
        const ticket = dataContext.ticket || {};
        let partsListString = "Nessun Ricambio";
        if (ticket.repair?.parts && ticket.repair.parts.length > 0) {
            partsListString = ticket.repair.parts.map(p => `- ${p.name} `).join('\n');
        } else if (ticket.repair?.partId) { 
            partsListString = "Ricambio Standard";
        }
        const repairTotal = ticket.repair?.totalCost || 0;
        const depositVal = ticket.repair?.deposit || 0;
        const balanceDue = Math.max(0, repairTotal - depositVal);
        const discountVal = ticket.repair?.discount || 0;
        
        const discountStr = discountVal > 0 ? `Sconto Applicato: -€ ${discountVal.toFixed(2)}\n` : '';
        let pricingText = `${discountStr}TOTALE STIMATO: € ${repairTotal.toFixed(2)}`;
        if (depositVal > 0) {
            pricingText += `\n\nAcconto Versato: € ${depositVal.toFixed(2)}\nSaldo da Saldare: € ${balanceDue.toFixed(2)}`;
        }
        head = [['Dettagli Ricambi', 'Preventivo Economico']];
        body = [[
            `Elenco Ricambi: \n${partsListString} `,
            pricingText
        ]];
        styles = { fontSize: 9, cellPadding: 2, valign: 'middle' };
        columnStyles = {
            0: { cellWidth: 120 },
            1: { cellWidth: 62, halign: 'right', fontStyle: 'bold' }
        };
    }
    else if (tableType === 'pricesSummary') {
        const ticket = dataContext.ticket || {};
        const repairTotal = ticket.repair?.totalCost || 0;
        const depositVal = ticket.repair?.deposit || 0;
        const balanceDue = Math.max(0, repairTotal - depositVal);
        const discountVal = ticket.repair?.discount || 0;
        
        const discountStr = discountVal > 0 ? `Sconto: -€ ${discountVal.toFixed(2)}\n` : '';
        let summaryText = `${discountStr}Totale Riparazione: € ${repairTotal.toFixed(2)}`;
        if (depositVal > 0) {
            summaryText += `\nAcconto Versato: € ${depositVal.toFixed(2)}\nSaldo Pagato: € ${balanceDue.toFixed(2)}`;
        }
        
        head = [['Dettaglio Costi', 'Riepilogo Pagamento']];
        body = [[
            `Tariffa Manodopera: € ${ticket.repair?.laborCost || 0}\nCosto Componenti: € ${(ticket.repair?.partsCost || 0)}`,
            summaryText
        ]];
        styles = { fontSize: 9, cellPadding: 2, valign: 'middle' };
        columnStyles = {
            0: { cellWidth: 110 },
            1: { cellWidth: 72, halign: 'right', fontStyle: 'bold' }
        };
    }
    else if (tableType === 'testerResults') {
        const manualChecks = dataContext.manualChecks || [];
        const customChecks = dataContext.customChecks || [];
        head = [['Componente / Sensore Collaudato', 'Stato Collaudo']];
        body = [
            ...manualChecks.map(c => [c.label, c.status === 'ok' ? 'PASSATO' : c.status === 'fail' ? 'FALLITO' : 'NON TESTABILE']),
            ...customChecks.map(c => [`${c.label} (Custom)`, c.status === 'ok' ? 'PASSATO' : c.status === 'fail' ? 'FALLITO' : 'NON TESTABILE'])
        ];
        styles = { fontSize: 8, cellPadding: 1.2 };
        columnStyles = {
            1: { fontStyle: 'bold' }
        };
    }
    else if (tableType === 'quoteDetails') {
        const quoteItems = dataContext.quoteItems || [];
        const total = dataContext.total || 0;
        head = [['Descrizione Intervento / Ricambio', 'Q.tà', 'Prezzo Unitario', 'Totale']];
        body = quoteItems.map(item => [
            item.description,
            item.quantity,
            `€ ${parseFloat(item.price).toFixed(2)}`,
            `€ ${(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}`
        ]);
        body.push([
            { content: 'TOTALE PREVENTIVATO', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: `€ ${parseFloat(total).toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right' } }
        ]);
        styles = { fontSize: 9, cellPadding: 2 };
        columnStyles = {
            0: { cellWidth: 110 },
            1: { cellWidth: 15, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 27, halign: 'right' }
        };
    }
    else if (tableType === 'pcComponents') {
        const components = dataContext.components || [];
        const total = dataContext.total || 0;
        head = [['Componente PC', 'Modello Selezionato / Descrizione', 'Prezzo']];
        body = components.map(c => [c.type, c.model || 'Non selezionato', c.price ? `€ ${parseFloat(c.price).toFixed(2)}` : '€ 0.00']);
        body.push([
            { content: 'COSTO TOTALE CONFIGURAZIONE (IVA inclusa)', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: `€ ${parseFloat(total).toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right' } }
        ]);
        styles = { fontSize: 8.5, cellPadding: 1.8 };
        columnStyles = {
            0: { cellWidth: 40, fontStyle: 'bold' },
            1: { cellWidth: 112 },
            2: { cellWidth: 30, halign: 'right' }
        };
    }
    else if (tableType === 'purchaseItems') {
        const items = dataContext.items || [];
        head = [['Prodotto / Ricambio', 'Q.tà', 'Prezzo Cad.', 'Sconto %', 'Totale']];
        body = items.map(item => [
            item.name,
            item.quantity || 1,
            `€ ${parseFloat(item.price || 0).toFixed(2)}`,
            `${item.discount || 0}%`,
            `€ ${parseFloat(item.total || 0).toFixed(2)}`
        ]);
        styles = { fontSize: 9, cellPadding: 2.5 };
        columnStyles = {
            0: { cellWidth: 100 },
            1: { cellWidth: 15, halign: 'center' },
            2: { cellWidth: 22, halign: 'right' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 25, halign: 'right' }
        };
    }
    else if (tableType === 'purchaseTotals') {
        const subtotal = parseFloat(dataContext.subtotal) || 0;
        const totalDiscount = parseFloat(dataContext.totalDiscount) || 0;
        const total = parseFloat(dataContext.total) || 0;
        const repairDeposit = parseFloat(dataContext.repairDeposit) || 0;
        const showDiscount = dataContext.showDiscountInPdf === true || dataContext.showDiscountInPdf === 'true';
        head = [];
        body = [
            ['Subtotale:', `€ ${subtotal.toFixed(2)}`]
        ];
        if (showDiscount && totalDiscount > 0) {
            body.push(['Sconto Totale:', `-€ ${totalDiscount.toFixed(2)}`]);
        }
        if (repairDeposit > 0) {
            body.push(['Acconto:', `-€ ${repairDeposit.toFixed(2)}`]);
            body.push(['Saldo:', `€ ${total.toFixed(2)}`]);
        } else {
            body.push(['TOTALE PAGATO:', `€ ${total.toFixed(2)}`]);
        }
        styles = { fontSize: 9, cellPadding: 1.8 };
        columnStyles = {
            0: { fontStyle: 'bold', halign: 'right', cellWidth: 45 },
            1: { halign: 'right', fontStyle: 'bold', cellWidth: 31 }
        };
        headStyles = { fillColor: false }; // no header
    }

    // Apply item custom styling if specified in layouts
    if (item.headerBgColor) {
        const rgb = hexToRgb(item.headerBgColor, { r: 253, g: 248, b: 225 });
        headStyles.fillColor = [rgb.r, rgb.g, rgb.b];
    }
    if (item.headerTextColor) {
        const rgb = hexToRgb(item.headerTextColor, { r: 40, g: 40, b: 40 });
        headStyles.textColor = [rgb.r, rgb.g, rgb.b];
    }
    let alternateRowStyles = undefined;
    if (item.altRowBgColor) {
        const rgb = hexToRgb(item.altRowBgColor, { r: 248, g: 250, b: 252 });
        alternateRowStyles = { fillColor: [rgb.r, rgb.g, rgb.b] };
    }
    if (item.fontSize) {
        styles.fontSize = item.fontSize;
    }
    if (item.cellPadding) {
        styles.cellPadding = item.cellPadding;
    }

    doc.autoTable({
        startY: startY,
        margin: { left: item.x, right: 210 - (item.x + (item.w || 182)) },
        head: head.length > 0 ? head : undefined,
        body: body,
        theme: head.length > 0 ? 'grid' : 'plain',
        headStyles: head.length > 0 ? headStyles : undefined,
        alternateRowStyles: head.length > 0 ? alternateRowStyles : undefined,
        styles: styles,
        columnStyles: columnStyles,
        didParseCell: (data) => {
            if (tableType === 'testerResults' && data.section === 'body' && data.column.index === 1) {
                const val = data.cell.raw;
                if (val === 'PASSATO') data.cell.styles.textColor = [0, 150, 0];
                if (val === 'FALLITO') data.cell.styles.textColor = [200, 0, 0];
            }
        }
    });

    return doc.lastAutoTable.finalY;
};

// Main Export Generator
export const pdfLayoutEngine = {
    generate: (templateId, dataContext) => {
        const layout = getLayout(templateId);
        const settings = dataManager.getSync('settings') || {};
        const pdfStyle = settings.pdfStyle || 'classic';
        const store = settings.pdfTemplate || {};

        const fullContext = {
            ...dataContext,
            store: {
                name: store.storeName || 'FIX OR TRASH',
                email: store.storeEmail || 'fixortrash@gmail.com',
                phone: store.storePhone || '3755417618',
                address: store.storeAddress || 'Via Roma 123, Torino',
                technician: store.technician || 'Tecnico',
                terms: store.terms || ''
            }
        };

        const isLabel = templateId === 'label';
        const doc = new jsPDF(isLabel ? {
            orientation: 'landscape',
            unit: 'mm',
            format: [80, 50]
        } : {
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Sorting by vertical flow coordinate
        const sortedItems = [...layout].sort((a, b) => a.y - b.y);

        let yOffset = 0;
        let lastTableBottomOriginal = 0;
        let lastTableBottomShifted = 0;

        for (let i = 0; i < sortedItems.length; i++) {
            const item = sortedItems[i];
            let itemY = item.y;
            
            // Push elements dynamically below expanded dynamic tables
            if (item.y > lastTableBottomOriginal && lastTableBottomOriginal > 0) {
                itemY = item.y + yOffset;
            }

            // Check dynamic page overflow for A4
            if (!isLabel && itemY > 275 && item.type !== 'image') {
                doc.addPage();
                yOffset = -item.y + 20; 
                itemY = 20;
                lastTableBottomOriginal = 0;
                lastTableBottomShifted = 0;
            }

            if (item.type === 'text') {
                const rawContent = replacePlaceholders(item.content, fullContext);
                const fontSize = item.fontSize || 10;
                doc.setFontSize(fontSize);
                
                let style = 'normal';
                if (item.fontWeight === 'bold') style = 'bold';
                doc.setFont('Helvetica', style);

                const color = hexToRgb(item.textColor || '#282828');
                doc.setTextColor(color.r, color.g, color.b);

                const splitText = doc.splitTextToSize(rawContent, item.w || 182);
                doc.text(splitText, item.x, itemY, { align: item.align || 'left' });
            } 
            else if (item.type === 'line') {
                const color = hexToRgb(item.textColor || '#282828');
                doc.setDrawColor(color.r, color.g, color.b);
                doc.setLineWidth(item.h || 0.3); // h acts as thickness
                doc.line(item.x, itemY, item.x + (item.w || 182), itemY);
            }
            else if (item.type === 'rect') {
                const fillColor = hexToRgb(item.fillColor || '#ffffff');
                const borderColor = hexToRgb(item.borderColor || '#cbd5e1');
                doc.setFillColor(fillColor.r, fillColor.g, fillColor.b);
                doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
                doc.setLineWidth(0.3);
                doc.rect(item.x, itemY, item.w || 50, item.h || 20, 'FD');
            }
            else if (item.type === 'image') {
                if (item.content === 'logo') {
                    try {
                        doc.addImage(logoReport, 'JPEG', item.x, itemY, item.w || 22, item.h || 22);
                    } catch (e) {
                        console.error("Layout logo rendering error:", e);
                    }
                }
            }
            else if (item.type === 'table') {
                const finalTableY = renderTable(doc, { ...item, y: itemY }, fullContext, pdfStyle);
                const approxOriginalHeight = 25; 
                lastTableBottomOriginal = item.y + approxOriginalHeight;
                lastTableBottomShifted = finalTableY;
                yOffset = lastTableBottomShifted - lastTableBottomOriginal;
            }
        }

        return doc;
    }
};
