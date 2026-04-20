/**
 * Google Apps Script - Universal Classroom Assistant Database API
 * 
 * Instructions:
 * 1. Go to https://script.google.com
 * 2. Create new project
 * 3. Copy this entire code
 * 4. Deploy as web app (Execute as: Me, Who has access: Anyone)
 * 5. Copy the deployment URL
 * 6. Use URL in React app as API endpoint
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// ============================================
// HELPER FUNCTIONS
// ============================================

function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return [];
  
  const headers = data[0];
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  
  return rows;
}

function addSheetRow(sheetName, rowData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return false;
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = headers.map(header => rowData[header] || "");
  
  sheet.appendRow(values);
  return true;
}

function findRowIndex(sheetName, searchKey, searchValue) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return -1;
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const keyIndex = headers.indexOf(searchKey);
  
  if (keyIndex === -1) return -1;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][keyIndex] == searchValue) {
      return i;
    }
  }
  
  return -1;
}

function updateSheetRow(sheetName, rowIndex, rowData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || rowIndex < 0) return false;
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  for (let j = 0; j < headers.length; j++) {
    const value = rowData[headers[j]] || "";
    sheet.getRange(rowIndex + 1, j + 1).setValue(value);
  }
  
  return true;
}

// ============================================
// API ENDPOINTS
// ============================================

function doGet(e) {
  const action = e.parameter.action;
  const sheetName = e.parameter.sheet;
  
  try {
    if (action === "getAll") {
      const data = getSheetData(sheetName);
      return ContentService.createTextOutput(JSON.stringify({ success: true, data }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "getById") {
      const id = e.parameter.id;
      const data = getSheetData(sheetName);
      const row = data.find(r => r.id == id);
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success: !!row, 
        data: row || null 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "getByUserId") {
      const userId = e.parameter.userId;
      const data = getSheetData(sheetName);
      const rows = data.filter(r => r.userId == userId);
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        data: rows 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "getByLessonId") {
      const lessonId = e.parameter.lessonId;
      const data = getSheetData(sheetName);
      const rows = data.filter(r => r.lessonId == lessonId);
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        data: rows 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: "Invalid action" 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const action = e.parameter.action;
  const sheetName = e.parameter.sheet;
  const data = JSON.parse(e.postData.contents);
  
  try {
    if (action === "add") {
      const success = addSheetRow(sheetName, data);
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success, 
        insertId: data.id || Date.now() 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "update") {
      const rowIndex = findRowIndex(sheetName, "id", data.id);
      const success = updateSheetRow(sheetName, rowIndex, data);
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: "Invalid action" 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// SETUP FUNCTION (Run once)
// ============================================

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create sheets if they don't exist
  const sheets = ["lessons", "refinements", "answers", "users"];
  
  sheets.forEach(sheetName => {
    if (!ss.getSheetByName(sheetName)) {
      ss.insertSheet(sheetName);
    }
  });
  
  // Setup lessons sheet
  const lessonsSheet = ss.getSheetByName("lessons");
  if (lessonsSheet.getLastRow() === 0) {
    lessonsSheet.appendRow([
      "id", "userId", "class", "subject", "topic", "toolType", 
      "language", "content", "createdAt", "updatedAt"
    ]);
  }
  
  // Setup refinements sheet
  const refinementsSheet = ss.getSheetByName("refinements");
  if (refinementsSheet.getLastRow() === 0) {
    refinementsSheet.appendRow([
      "id", "lessonId", "refinementType", "content", "createdAt"
    ]);
  }
  
  // Setup answers sheet
  const answersSheet = ss.getSheetByName("answers");
  if (answersSheet.getLastRow() === 0) {
    answersSheet.appendRow([
      "id", "lessonId", "questionNumber", "answer", "createdAt"
    ]);
  }
  
  // Setup users sheet
  const usersSheet = ss.getSheetByName("users");
  if (usersSheet.getLastRow() === 0) {
    usersSheet.appendRow([
      "id", "openId", "email", "name", "role", "createdAt"
    ]);
  }
  
  Logger.log("✅ Sheets setup complete!");
}
