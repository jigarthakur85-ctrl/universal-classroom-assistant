/**
 * Google Sheets Database Integration
 * Replaces MySQL with Google Sheets for free hosting
 */

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

interface SheetRow {
  [key: string]: string | number | boolean;
}

/**
 * Initialize Google Sheets API
 * Requires: GOOGLE_SHEETS_ID and GOOGLE_SHEETS_API_KEY env variables
 */
export async function initializeGoogleSheets() {
  if (!SPREADSHEET_ID || !SHEETS_API_KEY) {
    throw new Error("Google Sheets credentials not configured");
  }
  console.log("✅ Google Sheets initialized");
}

/**
 * Get all rows from a sheet
 */
export async function getSheetData(sheetName: string): Promise<SheetRow[]> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}?key=${SHEETS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.values || data.values.length === 0) {
      return [];
    }

    const headers = data.values[0];
    const rows: SheetRow[] = [];

    for (let i = 1; i < data.values.length; i++) {
      const row: SheetRow = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = data.values[i][j] || "";
      }
      rows.push(row);
    }

    return rows;
  } catch (error) {
    console.error(`Error reading sheet ${sheetName}:`, error);
    return [];
  }
}

/**
 * Add a new row to a sheet
 * Requires: GOOGLE_SHEETS_APPEND_TOKEN (OAuth token with write access)
 */
export async function addSheetRow(
  sheetName: string,
  row: SheetRow
): Promise<boolean> {
  try {
    const appendToken = process.env.GOOGLE_SHEETS_APPEND_TOKEN;
    if (!appendToken) {
      console.error("Google Sheets append token not configured");
      return false;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!A:Z:append?valueInputOption=USER_ENTERED`;

    const values = [Object.values(row)];

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appendToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    });

    return response.ok;
  } catch (error) {
    console.error(`Error adding row to ${sheetName}:`, error);
    return false;
  }
}

/**
 * Update a row in a sheet
 */
export async function updateSheetRow(
  sheetName: string,
  rowIndex: number,
  row: SheetRow
): Promise<boolean> {
  try {
    const appendToken = process.env.GOOGLE_SHEETS_APPEND_TOKEN;
    if (!appendToken) {
      console.error("Google Sheets append token not configured");
      return false;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!A${rowIndex + 1}:Z${rowIndex + 1}?valueInputOption=USER_ENTERED`;

    const values = [Object.values(row)];

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${appendToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    });

    return response.ok;
  } catch (error) {
    console.error(`Error updating row in ${sheetName}:`, error);
    return false;
  }
}

/**
 * Get a specific row by ID
 */
export async function getSheetRowById(
  sheetName: string,
  id: string | number
): Promise<SheetRow | null> {
  try {
    const rows = await getSheetData(sheetName);
    return rows.find((row) => row.id === id || row.id === String(id)) || null;
  } catch (error) {
    console.error(`Error getting row from ${sheetName}:`, error);
    return null;
  }
}

/**
 * Filter rows by condition
 */
export async function filterSheetRows(
  sheetName: string,
  condition: (row: SheetRow) => boolean
): Promise<SheetRow[]> {
  try {
    const rows = await getSheetData(sheetName);
    return rows.filter(condition);
  } catch (error) {
    console.error(`Error filtering rows from ${sheetName}:`, error);
    return [];
  }
}

/**
 * Create required sheets if they don't exist
 */
export async function ensureSheetsExist() {
  const requiredSheets = ["lessons", "refinements", "answers", "users"];

  for (const sheetName of requiredSheets) {
    try {
      const data = await getSheetData(sheetName);
      if (data.length === 0) {
        console.log(`⚠️ Sheet "${sheetName}" is empty. Please populate it.`);
      } else {
        console.log(`✅ Sheet "${sheetName}" exists with ${data.length} rows`);
      }
    } catch (error) {
      console.error(`⚠️ Sheet "${sheetName}" may not exist:`, error);
    }
  }
}
