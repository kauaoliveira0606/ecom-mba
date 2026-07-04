/**
 * Scorecard Apps Script — bound to your Google Sheet (Extensions > Apps Script).
 * Deploy as a Web App (Deploy > New deployment > Web app, "Anyone" access),
 * then set that deployment URL as SCORECARD_APPS_SCRIPT_URL in Vercel.
 *
 * Reads the active sheet (or a tab named by the `week` offset, if you keep
 * one tab per week) and returns raw CSV text matching the layout the
 * dashboard's frontend expects:
 *   - a header row
 *   - a date row (month abbreviations in columns B-H) within the first few rows
 *   - metric rows: col A = name, B-H = 7 daily values, I = weekly goal, J = weekly actual
 *   - then __LAST7__ / __LAST30__ / __ALLTIME__ marker rows, each followed by
 *     two-column (name, value) rows
 */
function doGet(e) {
  const weekOffset = parseInt(e.parameter.week || '0', 10);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getSheetForWeek(ss, weekOffset);
  const timeZone = ss.getSpreadsheetTimeZone();

  const values = sheet.getDataRange().getValues();
  const csv = values.map(row => row.map(v => csvEscape(v, timeZone)).join(',')).join('\n');

  return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.CSV);
}

// Adjust this if you keep a single running sheet vs. one tab per week.
// Example here assumes tabs named "Week 0", "Week 1", ... where 0 = current week.
function getSheetForWeek(ss, weekOffset) {
  const name = 'Week ' + weekOffset;
  const sheet = ss.getSheetByName(name);
  if (sheet) return sheet;
  return ss.getSheets()[0]; // fallback to first tab
}

function csvEscape(value, timeZone) {
  // Format real Date cells as "Jul 5" so the frontend's month-abbreviation
  // detection (used to find the date header row) matches correctly.
  let str;
  if (Object.prototype.toString.call(value) === '[object Date]') {
    str = Utilities.formatDate(value, timeZone, 'MMM d');
  } else {
    str = String(value == null ? '' : value);
  }
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
