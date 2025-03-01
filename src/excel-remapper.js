/**
 * Excel/CSV Data Remapper
 * 
 * This module takes input data and remaps it according to a template
 * based on a configuration file with field mappings.
 */

// Required libraries
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

/**
 * Main remapping function that processes data according to the provided configuration
 * 
 * @param {string} templateFilePath - Path to the template file (Excel or CSV)
 * @param {string} inputFilePath - Path to the input data file (Excel or CSV)
 * @param {Object} configObj - Configuration object with field mappings
 * @param {string} [outputFilePath] - Optional output file path (if not provided, will return data)
 * @returns {Object} Result object with data and metadata
 */
function remapData(templateFilePath, inputFilePath, configObj, outputFilePath = null) {
  console.log('Starting data remapping process...');
  
  // Extract options from config
  const csvOptions = configObj.csvOptions || {
    delimiter: ',',
    quoteChar: '"',
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false // Default to FALSE to preserve string formats like "018"
  };
  
  const fieldMappings = configObj.fieldMappings || {};
  
  // Determine file types based on extensions
  const templateExt = path.extname(templateFilePath).toLowerCase();
  const inputExt = path.extname(inputFilePath).toLowerCase();
  const isTemplateCSV = templateExt === '.csv';
  const isInputCSV = inputExt === '.csv';
  
  // -----------------------------
  // Load and parse template file
  // -----------------------------
  let templateData;
  console.log(`Loading template file: ${templateFilePath}`);
  
  if (isTemplateCSV) {
    const templateContent = fs.readFileSync(templateFilePath, 'utf8');
    const parsedTemplate = Papa.parse(templateContent, {
      ...csvOptions,
      header: false // We always want headers as separate array for template
    });
    
    if (parsedTemplate.errors.length > 0) {
      console.error('Errors parsing template CSV:', parsedTemplate.errors);
    }
    
    templateData = parsedTemplate.data;
  } else {
    // Excel file
    const templateWorkbook = XLSX.readFile(templateFilePath);
    const templateSheet = templateWorkbook.Sheets[templateWorkbook.SheetNames[0]];
    templateData = XLSX.utils.sheet_to_json(templateSheet, { header: 1 });
  }
  
  // Extract template headers (first row of template)
  const templateHeaders = templateData[0];
  console.log('Template headers:', templateHeaders);
  
  // Check if all template headers have mappings
  templateHeaders.forEach(header => {
    if (!fieldMappings[header]) {
      console.warn(`Warning: No mapping defined for template header "${header}"`);
    }
  });
  
  // -----------------------------
  // Load and parse input data file
  // -----------------------------
  let inputRows;
  console.log(`Loading input data file: ${inputFilePath}`);
  
  // Statistics for processing report
  const stats = {
    totalRows: 0,
    errorRows: 0,
    warnings: 0,
    parseErrors: []
  };
  
  if (isInputCSV) {
    const dataContent = fs.readFileSync(inputFilePath, 'utf8');
    
    // Enhanced parsing options for complex CSV data
    const parsedData = Papa.parse(dataContent, {
      ...csvOptions,
      header: true, // We want objects with column names as keys for data
      escapeChar: '\\', // Handle escaped quotes
      skipEmptyLines: true,
      comments: false // Don't treat any lines as comments
    });
    
    // Store parse errors without duplicates
    if (parsedData.errors.length > 0) {
      // Only log errors in verbose mode or if there are new error types
      const uniqueErrors = [];
      const seen = new Set();
      
      parsedData.errors.forEach(err => {
        const errorKey = `${err.type}:${err.message}:${err.row}`;
        if (!seen.has(errorKey)) {
          seen.add(errorKey);
          uniqueErrors.push({
            ...err,
            row: err.row + 1
          });
        }
      });
      
      // Only store unique errors
      stats.parseErrors = uniqueErrors.map(err => ({
        type: err.type,
        message: err.message,
        row: err.row // Already adjusted above
      }));
      
      // Add unique parse errors to warnings count
      stats.warnings += stats.parseErrors.length;
    }
    
    // Check for duplicate headers
    if (parsedData.meta && parsedData.meta.fields) {
      const fieldCounts = {};
      parsedData.meta.fields.forEach(field => {
        fieldCounts[field] = (fieldCounts[field] || 0) + 1;
      });
      
      const duplicates = Object.entries(fieldCounts)
        .filter(([field, count]) => count > 1)
        .map(([field]) => field);
      
      if (duplicates.length > 0) {
        console.warn('WARNING: Found duplicate column headers in data file:', duplicates);
        console.warn('This may cause data mapping issues. Consider renaming columns to be unique.');
      }
    }
    
    inputRows = parsedData.data;
  } else {
    // Excel file
    const dataWorkbook = XLSX.readFile(inputFilePath);
    const dataSheet = dataWorkbook.Sheets[dataWorkbook.SheetNames[0]];
    inputRows = XLSX.utils.sheet_to_json(dataSheet);
  }
  
  // -----------------------------
  // Process data mapping
  // -----------------------------
  console.log(`Processing ${inputRows.length} rows of data...`);
  
  // Create result data with template headers
  const resultData = [templateHeaders];
  
  // Update total rows in stats
  stats.totalRows = inputRows.length;
  
  // Get validation warnings from config if present
  if (configObj.validationWarnings) {
    stats.validationWarnings = configObj.validationWarnings;
  }
  
  // Process each row from the input file
  inputRows.forEach((dataRow, rowIndex) => {
    const resultRow = [];
    let rowHasError = false;
    
    // For each template column, apply the corresponding mapping function
    templateHeaders.forEach(templateHeader => {
      if (fieldMappings[templateHeader]) {
        try {
          // Pass both the data row and the row index to the mapping function
          const mappedValue = fieldMappings[templateHeader](dataRow, rowIndex);
          resultRow.push(mappedValue);
        } catch (error) {
          console.error(`Error mapping field "${templateHeader}" for row ${rowIndex + 1}:`, error);
          resultRow.push('ERROR');
          rowHasError = true;
          stats.warnings++;
        }
      } else {
        resultRow.push(''); // Empty value for unmapped fields
      }
    });
    
    if (rowHasError) {
      stats.errorRows++;
    }
    
    resultData.push(resultRow);
  });
  
  // -----------------------------
  // Generate output
  // -----------------------------
  // Create a workbook for the result
  const resultWorkbook = XLSX.utils.book_new();
  
  // Create a worksheet from the result data, ensuring string types are preserved
  const resultSheet = XLSX.utils.aoa_to_sheet(resultData, {
    raw: true, // Prevents auto-conversion of values that look like numbers
    cellDates: true // Preserves date formats
  });
  
  // Add the sheet to the workbook
  XLSX.utils.book_append_sheet(resultWorkbook, resultSheet, 'Remapped Data');
  
  // If output file path is provided, save the result
  if (outputFilePath) {
    const outputExt = path.extname(outputFilePath).toLowerCase();
    
    if (outputExt === '.csv') {
      console.log(`Saving as CSV file: ${outputFilePath}`);
      
      // Generate CSV content with proper quoting to handle delimiters
      const outputCSV = Papa.unparse(resultData, {
        delimiter: csvOptions.delimiter || ',',
        quoteChar: csvOptions.quoteChar || '"',
        escapeChar: '\\',
        header: true,
        skipEmptyLines: true
      });
      
      fs.writeFileSync(outputFilePath, outputCSV, 'utf8');
    } else {
      // Save as Excel
      console.log(`Saving as Excel file: ${outputFilePath}`);
      XLSX.writeFile(resultWorkbook, outputFilePath);
    }
    
    console.log(`Remapping complete! Output saved to: ${outputFilePath}`);
  }
  
  // Summary of the processing - simplified
  console.log(`\n===== Remapping Summary =====`);
  console.log(`Total rows processed: ${stats.totalRows}`);
  
  if (stats.errorRows > 0) {
    console.log(`Rows with errors: ${stats.errorRows}`);
  }
  
  // Calculate unique warnings
  const uniqueWarnings = (stats.parseErrors ? stats.parseErrors.length : 0) + 
                        (stats.validationWarnings || 0);
  
  if (uniqueWarnings > 0) {
    console.log(`Total warnings: ${uniqueWarnings}`);
  }
  
  // Return the result data and the workbook for further processing if needed
  return {
    headers: templateHeaders,
    data: resultData.slice(1), // Skip header row
    workbook: resultWorkbook,
    stats: stats
  };
}

/**
 * Utility function to check for duplicates in a specific column
 * 
 * @param {string} filePath - Path to the file to check
 * @param {string} columnName - Name of the column to check for duplicates
 * @param {string} [delimiter=','] - CSV delimiter (if applicable)
 * @returns {Array} Array of objects with duplicate information
 */
function checkForDuplicates(filePath, columnName, delimiter = ',') {
  console.log(`Checking for duplicates in column "${columnName}" of file: ${filePath}`);
  
  const fileExt = path.extname(filePath).toLowerCase();
  let data = [];
  
  if (fileExt === '.csv') {
    // CSV file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parseResult = Papa.parse(fileContent, {
      header: true,
      delimiter: delimiter,
      skipEmptyLines: true
    });
    data = parseResult.data;
  } else {
    // Excel file
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    data = XLSX.utils.sheet_to_json(sheet);
  }
  
  // Count occurrences of each value
  const valueCounts = {};
  data.forEach((row, index) => {
    const value = row[columnName];
    if (value !== undefined && value !== null) {
      valueCounts[value] = (valueCounts[value] || []);
      valueCounts[value].push(index + 2); // +2 because of 0-indexing and header row
    }
  });
  
  // Find duplicates
  const duplicates = Object.entries(valueCounts)
    .filter(([value, indices]) => indices.length > 1)
    .map(([value, indices]) => ({
      value,
      count: indices.length,
      rowNumbers: indices
    }));
  
  if (duplicates.length > 0) {
    console.warn(`WARNING: Found ${duplicates.length} duplicate values in column "${columnName}"`);
    duplicates.forEach(dup => {
      console.warn(`  Value "${dup.value}" appears ${dup.count} times in rows: ${dup.rowNumbers.join(', ')}`);
    });
  } else {
    console.log(`No duplicates found in column "${columnName}"`);
  }
  
  return duplicates;
}

// Export the functions
module.exports = {
  remapData,
  checkForDuplicates
};