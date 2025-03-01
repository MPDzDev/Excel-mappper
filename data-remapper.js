#!/usr/bin/env node

/**
 * Excel/CSV Data Remapper - Main Entry Point
 * 
 * A simplified interface for the data remapper that automatically resolves
 * file paths to the correct folders and makes the tool easier to use.
 * 
 * Usage:
 *   node data-remapper.js <template> <input> <config> <output>
 * 
 * Where:
 *   <template> - Name of template file (will search in data/templates/)
 *   <input>    - Name of input file (will search in data/input/)
 *   <config>   - Name of config file (will search in config/)
 *   <output>   - Name for output file (will save to data/output/)
 * 
 * Example:
 *   node data-remapper.js template.csv source-data.csv mapping-config.json result.csv
 */

const fs = require('fs');
const path = require('path');
const { remapWithConfig } = require('./src/advanced-remapper');

// Default folder paths
const FOLDERS = {
  templates: path.join(__dirname, 'data', 'templates'),
  input: path.join(__dirname, 'data', 'input'),
  config: path.join(__dirname, 'config'),
  output: path.join(__dirname, 'data', 'output')
};

// Ensure all folders exist
Object.values(FOLDERS).forEach(folder => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`Created folder: ${folder}`);
  }
});

// Helper function to search for a file in a folder
function findFile(filename, folder) {
  // First, check if the file exists exactly as specified
  const exactPath = path.join(folder, filename);
  if (fs.existsSync(exactPath)) {
    return exactPath;
  }
  
  // If not, try to find a case-insensitive match
  const files = fs.readdirSync(folder);
  const match = files.find(file => file.toLowerCase() === filename.toLowerCase());
  
  if (match) {
    return path.join(folder, match);
  }
  
  // If file doesn't exist anywhere
  return null;
}

// Main function
function main() {
  // Display the app name and version
  console.log('\n===== Excel/CSV Data Remapper =====\n');
  
  // Handle command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage:');
    console.log('  node data-remapper.js <template> <input> <config> [output]');
    console.log('\nWhere:');
    console.log('  <template> - Name of template file (will search in data/templates/)');
    console.log('  <input>    - Name of input file (will search in data/input/)');
    console.log('  <config>   - Name of config file (will search in config/)');
    console.log('  [output]   - Name for output file (will save to data/output/)');
    console.log('              If not provided, will use input filename with "-mapped" suffix');
    console.log('\nExample:');
    console.log('  node data-remapper.js template.csv customer-data.csv basic-config.json mapped-customers.csv');
    return;
  }
  
  // Parse arguments
  const [templateName, inputName, configName, outputName] = args;
  
  // Default output name if not provided
  const defaultOutputName = inputName.replace(/(\.[^.]+)$/, '-mapped$1');
  const finalOutputName = outputName || defaultOutputName;
  
  // Resolve file paths
  console.log('Resolving file paths...');
  
  // Find template file
  const templatePath = findFile(templateName, FOLDERS.templates);
  if (!templatePath) {
    console.error(`Error: Template file "${templateName}" not found in ${FOLDERS.templates}`);
    return;
  }
  console.log(`✓ Template: ${templatePath}`);
  
  // Find input file
  const inputPath = findFile(inputName, FOLDERS.input);
  if (!inputPath) {
    console.error(`Error: Input file "${inputName}" not found in ${FOLDERS.input}`);
    return;
  }
  console.log(`✓ Input: ${inputPath}`);
  
  // Find config file
  const configPath = findFile(configName, FOLDERS.config);
  if (!configPath) {
    console.error(`Error: Config file "${configName}" not found in ${FOLDERS.config}`);
    return;
  }
  console.log(`✓ Config: ${configPath}`);
  
  // Set output path
  const outputPath = path.join(FOLDERS.output, finalOutputName);
  console.log(`✓ Output: ${outputPath}`);
  
  // Run the remapping with resolved paths
  console.log('\nStarting data remapping process...');
  
  try {
    const result = remapWithConfig(templatePath, inputPath, configPath, outputPath);
    
    // Clear console output to remove duplicate messages
    console.clear();
    console.log('\n===== Excel/CSV Data Remapper =====');
    
    console.log('\n✅ Remapping completed successfully!');
    console.log(`Processed ${result.stats.totalRows} rows of data`);
    
    // Process and display issues without duplication
    const issues = [];
    
    // Add ID validation issues
    if (result.validation && result.validation.validationMessages) {
      result.validation.validationMessages.forEach(msg => {
        issues.push({
          type: 'ID Validation',
          message: msg
        });
      });
    }
    
    // Add CSV parsing issues (de-duplicated)
    if (result.stats.parseErrors) {
      result.stats.parseErrors.forEach(err => {
        issues.push({
          type: 'CSV Format',
          message: `Row ${err.row}: ${err.message}`
        });
      });
    }
    
    // If we have issues, display them in a clean format
    if (issues.length > 0) {
      console.log(`\n⚠️ Issues Found: ${issues.length}`);
      
      // Group issues by type
      const issuesByType = {};
      issues.forEach(issue => {
        if (!issuesByType[issue.type]) {
          issuesByType[issue.type] = [];
        }
        issuesByType[issue.type].push(issue.message);
      });
      
      // Display issues by type
      Object.keys(issuesByType).forEach(type => {
        console.log(`\n${type} Issues:`);
        issuesByType[type].forEach(message => {
          console.log(`  - ${message}`);
        });
      });
    }
    
    console.log(`\nOutput file saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('\n❌ Error during remapping:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();