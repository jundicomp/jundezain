function doGet(e) {
  const callback = String((e && e.parameter && e.parameter.callback) || 'jundezainCounterCallback');
  if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService.createTextOutput('Callback tidak valid')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  let total = 0;
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName('Counter');

    if (!sheet) {
      sheet = spreadsheet.insertSheet('Counter');
      sheet.getRange('A1').setValue('Total Kunjungan');
      sheet.getRange('B1').setValue(0);
    }

    total = Number(sheet.getRange('B1').getValue()) || 0;
    if (!e || !e.parameter || e.parameter.action !== 'read') {
      total += 1;
      sheet.getRange('B1').setValue(total);
      SpreadsheetApp.flush();
    }
  } finally {
    lock.releaseLock();
  }

  const response = callback + '(' + JSON.stringify({ count: total }) + ')';
  return ContentService.createTextOutput(response)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName('Leads');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('Leads');
      sheet.appendRow(['Waktu', 'Nama', 'WhatsApp', 'Kebutuhan', 'Pesan', 'Sumber', 'Halaman', 'Persetujuan']);
      sheet.setFrozenRows(1);
    }
    const params = (e && e.parameter) || {};
    sheet.appendRow([new Date(), clean_(params.nama, 80), clean_(params.whatsapp, 20), clean_(params.kebutuhan, 80), clean_(params.pesan, 500), clean_(params.sumber, 50), clean_(params.halaman, 500), clean_(params.persetujuan, 10)]);
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
  } finally { lock.releaseLock(); }
}

function clean_(value, maxLength) {
  let text = String(value || '').trim().slice(0, maxLength);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}
