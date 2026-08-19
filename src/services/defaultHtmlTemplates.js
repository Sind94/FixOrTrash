export const DEFAULT_HTML_TEMPLATES = {
    checkin: `<div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 15mm 15mm; color: #282828; line-height: 1.4; box-sizing: border-box; width: 210mm; min-height: 297mm; background: white;">
  <!-- Header -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
    <tr>
      <td style="width: 75px; vertical-align: top;">
        <img src="{{store.logo}}" style="width: 65px; height: 65px; object-fit: contain;"/>
      </td>
      <td style="vertical-align: top; padding-left: 15px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: #1e293b; letter-spacing: -0.5px;">{{store.name}}</h1>
        <p style="margin: 3px 0 0 0; font-size: 10px; color: #64748b;">
          Email: {{store.email}} | Tel: {{store.phone}}
        </p>
        <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">
          Indirizzo: {{store.address}}
        </p>
      </td>
      <td style="vertical-align: top; text-align: right; font-size: 11px; color: #64748b;">
        <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 4px;">ACCETTAZIONE RIPARAZIONE</div>
        <div>ID Ticket: <strong style="color: #0f172a;">#{{ticket.id}}</strong></div>
        <div>Data: {{ticket.date}}</div>
        <div>Tecnico: {{ticket.technician}}</div>
      </td>
    </tr>
  </table>

  <!-- Customer Info Table -->
  <div style="margin-bottom: 15px;">
    {{table.customerInfo}}
  </div>

  <!-- Checklist Components -->
  <div style="margin-bottom: 15px;">
    <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; border-bottom: 2px solid #cbd5e1; padding-bottom: 3px; color: #475569;">Stato Ingresso Dispositivo</h3>
    {{table.checklist}}
  </div>

  <!-- Repair and Price Details -->
  <div style="margin-bottom: 15px;">
    <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; border-bottom: 2px solid #cbd5e1; padding-bottom: 3px; color: #475569;">Intervento Preventivato</h3>
    {{table.repairItems}}
  </div>

  <!-- Terms and Signatures -->
  <div style="font-size: 8px; color: #64748b; margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 8px; text-align: justify;">
    {{store.terms}}
  </div>

  <table style="width: 100%; margin-top: 25px; border-collapse: collapse;">
    <tr>
      <td style="width: 45%; border-top: 1px solid #94a3b8; padding-top: 5px; font-size: 9px; color: #475569; text-align: center;">
        Firma Tecnico
      </td>
      <td style="width: 10%;"></td>
      <td style="width: 45%; border-top: 1px solid #94a3b8; padding-top: 5px; font-size: 9px; color: #475569; text-align: center;">
        Firma Cliente per Accettazione
      </td>
    </tr>
  </table>
</div>`,

    checkout: `<div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 15mm 15mm; color: #282828; line-height: 1.4; box-sizing: border-box; width: 210mm; min-height: 297mm; background: white;">
  <!-- Header -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
    <tr>
      <td style="width: 75px; vertical-align: top;">
        <img src="{{store.logo}}" style="width: 65px; height: 65px; object-fit: contain;"/>
      </td>
      <td style="vertical-align: top; padding-left: 15px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: #1e293b; letter-spacing: -0.5px;">{{store.name}}</h1>
        <p style="margin: 3px 0 0 0; font-size: 10px; color: #64748b;">
          Email: {{store.email}} | Tel: {{store.phone}}
        </p>
        <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">
          Indirizzo: {{store.address}}
        </p>
      </td>
      <td style="vertical-align: top; text-align: right; font-size: 11px; color: #64748b;">
        <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 4px;">RICEVUTA DI CONSEGNA</div>
        <div>Data Ritiro: <strong style="color: #0f172a;">{{current.date}}</strong></div>
        <div>Riferimento Ticket: <strong>#{{ticket.id}}</strong></div>
      </td>
    </tr>
  </table>

  <!-- Ticket Summary Details -->
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 15px; font-size: 11px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="width: 50%; vertical-align: top;">
          <strong>Cliente:</strong> {{customer.name}}<br/>
          <strong>Recapito:</strong> {{customer.phone}}
        </td>
        <td style="width: 50%; vertical-align: top;">
          <strong>Dispositivo:</strong> {{device.info}}<br/>
          <strong>Seriale/IMEI:</strong> {{device.imei}}
        </td>
      </tr>
    </table>
  </div>

  <!-- Checklist Collaudo -->
  <div style="margin-bottom: 15px;">
    <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; border-bottom: 2px solid #cbd5e1; padding-bottom: 3px; color: #475569;">Esito Collaudo Post-Riparazione</h3>
    {{table.checkoutChecklist}}
  </div>

  <!-- Totals / Prices -->
  <div style="margin-bottom: 15px;">
    <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; border-bottom: 2px solid #cbd5e1; padding-bottom: 3px; color: #475569;">Riepilogo Costi & Pagamenti</h3>
    {{table.pricesSummary}}
  </div>

  <!-- Terms and Signatures -->
  <div style="font-size: 8px; color: #64748b; margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
    {{store.terms}}
  </div>

  <table style="width: 100%; margin-top: 30px; border-collapse: collapse;">
    <tr>
      <td style="width: 45%; border-top: 1px solid #94a3b8; padding-top: 5px; font-size: 9px; color: #475569; text-align: center;">
        Consegnato da (Tecnico)
      </td>
      <td style="width: 10%;"></td>
      <td style="width: 45%; border-top: 1px solid #94a3b8; padding-top: 5px; font-size: 9px; color: #475569; text-align: center;">
        Firma Cliente per Ritiro e Accettazione Collaudo
      </td>
    </tr>
  </table>
</div>`,

    tester: `<div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 15mm 15mm; color: #282828; line-height: 1.4; box-sizing: border-box; width: 210mm; min-height: 297mm; background: white;">
  <!-- Header -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
    <tr>
      <td style="width: 75px; vertical-align: top;">
        <img src="{{store.logo}}" style="width: 65px; height: 65px; object-fit: contain;"/>
      </td>
      <td style="vertical-align: top; padding-left: 15px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: #1e293b; letter-spacing: -0.5px;">{{store.name}}</h1>
        <p style="margin: 3px 0 0 0; font-size: 10px; color: #64748b;">
          Email: {{store.email}} | Tel: {{store.phone}}
        </p>
        <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">
          Tecnico: {{store.technician}}
        </p>
      </td>
      <td style="vertical-align: top; text-align: right; width: 180px;">
        <div style="background: #eab308; color: #282828; font-weight: 800; font-size: 12px; padding: 6px 12px; border-radius: 6px; display: inline-block; text-align: center; margin-bottom: 4px;">
          REPORT COLLAUDO DIAGNOSTICO
        </div>
        <div style="font-size: 10px; color: #64748b;">Data: {{current.date}} | Scheda: #{{ticket.id}}</div>
      </td>
    </tr>
  </table>

  <!-- Ticket/Device Details -->
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 15px; font-size: 11px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="width: 50%; vertical-align: top;">
          <strong>Cliente:</strong> {{customer.name}}<br/>
          <strong>Telefono:</strong> {{customer.phone}}
        </td>
        <td style="width: 50%; vertical-align: top;">
          <strong>Dispositivo:</strong> {{device.info}}<br/>
          <strong>Seriale/IMEI:</strong> {{device.imei}}
        </td>
      </tr>
    </table>
  </div>

  <!-- Tester Results -->
  <div style="margin-bottom: 15px;">
    <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; border-bottom: 2px solid #cbd5e1; padding-bottom: 3px; color: #475569;">Esito Controlli Strumentali & Sensori</h3>
    {{table.testerResults}}
  </div>

  <!-- Footer Terms -->
  <div style="font-size: 8px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
    {{store.terms}}
  </div>
</div>`,

    quote: `<div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 15mm 15mm; color: #282828; line-height: 1.4; box-sizing: border-box; width: 210mm; min-height: 297mm; background: white;">
  <!-- Header -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
    <tr>
      <td style="width: 75px; vertical-align: top;">
        <img src="{{store.logo}}" style="width: 65px; height: 65px; object-fit: contain;"/>
      </td>
      <td style="vertical-align: top; padding-left: 15px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: #1e293b; letter-spacing: -0.5px;">{{store.name}}</h1>
        <p style="margin: 3px 0 0 0; font-size: 10px; color: #64748b;">
          Email: {{store.email}} | Tel: {{store.phone}}
        </p>
        <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">
          Indirizzo: {{store.address}}
        </p>
      </td>
      <td style="vertical-align: top; text-align: right; font-size: 11px; color: #64748b;">
        <div style="font-weight: 800; font-size: 14px; color: #3b82f6; margin-bottom: 4px;">PREVENTIVO ESTIMATIVO</div>
        <div>Data Emissione: <strong style="color: #0f172a;">{{current.date}}</strong></div>
        {{~ticket.id}}<div>Rif. Scheda: <strong>#{{ticket.id}}</strong></div>{{~ticket.id}}
      </td>
    </tr>
  </table>

  <!-- Customer & Device details -->
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 15px; font-size: 11px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="width: 50%; vertical-align: top;">
          <strong>Cliente Spett.le:</strong> {{customer.name}}<br/>
          <strong>Recapito:</strong> {{customer.phone}}
        </td>
        <td style="width: 50%; vertical-align: top;">
          <strong>Oggetto Preventivo:</strong> Riparazione {{device.info}}<br/>
          {{~ticket.defect}}<strong>Diagnosi Preliminare:</strong> {{ticket.defect}}{{~ticket.defect}}
        </td>
      </tr>
    </table>
  </div>

  <!-- Quote items table -->
  <div style="margin-bottom: 20px;">
    {{table.quoteDetails}}
  </div>

  <!-- Terms -->
  <div style="background: #f1f5f9; border-radius: 6px; padding: 10px; font-size: 9px; color: #475569; margin-bottom: 25px;">
    <strong>Condizioni Generali:</strong><br/>
    Il presente preventivo ha validità di 30 giorni dalla data di emissione. I prezzi indicati sono comprensivi di ricambi e manodopera. In caso di complicazioni durante la lavorazione, il cliente verrà tempestivamente contattato prima di procedere.<br/>
    <span style="font-size: 8px; color: #64748b; margin-top: 3px; display: block;">Prestazione non soggetta a ritenuta d'acconto - Regime Forfettario.</span>
  </div>

  <table style="width: 100%; margin-top: 40px; border-collapse: collapse;">
    <tr>
      <td></td>
      <td style="width: 50%; border-top: 1px solid #94a3b8; padding-top: 5px; font-size: 9px; color: #475569; text-align: center;">
        Firma per Accettazione e Conferma Ordine
      </td>
    </tr>
  </table>
</div>`,

    pc_config: `<div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 15mm 15mm; color: #282828; line-height: 1.4; box-sizing: border-box; width: 210mm; min-height: 297mm; background: white;">
  <!-- Header -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
    <tr>
      <td style="width: 75px; vertical-align: top;">
        <img src="{{store.logo}}" style="width: 65px; height: 65px; object-fit: contain;"/>
      </td>
      <td style="vertical-align: top; padding-left: 15px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: #1e293b; letter-spacing: -0.5px;">{{store.name}}</h1>
        <p style="margin: 3px 0 0 0; font-size: 10px; color: #64748b;">
          Email: {{store.email}} | Tel: {{store.phone}}
        </p>
        <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">
          Indirizzo: {{store.address}}
        </p>
      </td>
      <td style="vertical-align: top; text-align: right; font-size: 11px; color: #64748b;">
        <div style="font-weight: 800; font-size: 14px; color: #10b981; margin-bottom: 4px;">CONFIGURAZIONE CUSTOM PC</div>
        <div>Data: <strong style="color: #0f172a;">{{current.date}}</strong></div>
        <div>Cliente: <strong>{{customer.name}}</strong></div>
      </td>
    </tr>
  </table>

  <!-- Config notes -->
  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px; margin-bottom: 15px; font-size: 11px;">
    <strong>Destinazione d'Uso:</strong> {{config.useCase}} | <strong>Profilo:</strong> {{config.profile}}<br/>
    {{~config.softwares}}<strong>Software Chiave:</strong> {{config.softwares}}<br/>{{~config.softwares}}
    {{~config.notes}}<strong>Note Richieste:</strong> {{config.notes}}{{~config.notes}}
  </div>

  <!-- Components table -->
  <div style="margin-bottom: 15px;">
    {{table.pcComponents}}
  </div>

  <!-- Terms -->
  <div style="font-size: 9px; color: #64748b; margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
    <strong>Garanzia Hardware:</strong> I singoli componenti godono della garanzia ufficiale del rispettivo produttore (solitamente 24 mesi). Il servizio di assemblaggio e stress-test comprende una garanzia di 12 mesi sul corretto funzionamento dell'assemblato. I tempi di consegna stimati sono di 5-7 giorni lavorativi dall'acconto.
  </div>

  <table style="width: 100%; margin-top: 30px; border-collapse: collapse;">
    <tr>
      <td></td>
      <td style="width: 50%; border-top: 1px solid #94a3b8; padding-top: 5px; font-size: 9px; color: #475569; text-align: center;">
        Firma per Accettazione Preventivo Componenti
      </td>
    </tr>
  </table>
</div>`,

    label: `<div style="width: 80mm; height: 50mm; padding: 4mm; box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #000; line-height: 1.35; background: white;">
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #000; padding-bottom: 3px; margin-bottom: 5px;">
    <strong style="font-size: 13px; text-transform: uppercase;">{{store.name}}</strong>
    <span style="font-weight: bold;">TICKET: #{{ticket.id}}</span>
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
    <tr>
      <td style="font-weight: bold; width: 65px; padding: 3px 0; vertical-align: top;">CLIENTE:</td>
      <td style="padding: 3px 0; vertical-align: top;">{{customer.name}}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; padding: 3px 0; vertical-align: top;">DEVICE:</td>
      <td style="padding: 3px 0; vertical-align: top;">{{device.info}}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; padding: 3px 0; vertical-align: top;">DIFETTO:</td>
      <td style="padding: 3px 0; vertical-align: top; font-size: 10px; color: #333;">{{device.defect}}</td>
    </tr>
  </table>
</div>`,

    purchase: `<div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 15mm 15mm; color: #282828; line-height: 1.4; box-sizing: border-box; width: 210mm; min-height: 297mm; background: white;">
  <!-- Header -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
    <tr>
      <td style="width: 75px; vertical-align: top;">
        <img src="{{store.logo}}" style="width: 65px; height: 65px; object-fit: contain;"/>
      </td>
      <td style="vertical-align: top; padding-left: 15px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: #1e293b; letter-spacing: -0.5px;">{{store.name}}</h1>
        <p style="margin: 3px 0 0 0; font-size: 10px; color: #64748b;">
          Email: {{store.email}} | Tel: {{store.phone}}
        </p>
        <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">
          Indirizzo: {{store.address}}
        </p>
      </td>
      <td style="vertical-align: top; text-align: right; font-size: 11px; color: #64748b;">
        <div style="font-weight: 800; font-size: 14px; color: #0f172a; margin-bottom: 4px;">RICEVUTA DI VENDITA</div>
        <div>Numero Vendita: <strong style="color: #0f172a;">#{{purchase.id}}</strong></div>
        <div>Data: {{current.date}}</div>
      </td>
    </tr>
  </table>

  <!-- Customer details -->
  {{~customer.name}}
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 15px; font-size: 11px;">
    <strong>Cliente Spett.le:</strong> {{customer.name}} | <strong>Tel:</strong> {{customer.phone}} | <strong>Email:</strong> {{customer.email}}
  </div>
  {{~customer.name}}

  <!-- Purchase Items Table -->
  <div style="margin-bottom: 15px;">
    {{table.purchaseItems}}
  </div>

  <!-- Totals Section -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
    <tr>
      <td style="width: 60%;"></td>
      <td style="width: 40%; vertical-align: top;">
        {{table.purchaseTotals}}
      </td>
    </tr>
  </table>

  <!-- Terms -->
  <div style="font-size: 9px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; text-align: center;">
    Grazie per il tuo acquisto! Per qualsiasi informazione, garanzia o reso, presenta questa ricevuta in negozio.
  </div>
</div>`
};
