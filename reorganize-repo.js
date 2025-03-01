/**
 * Repository Reorganization Script
 * 
 * This script reorganizes the flat project structure into a more organized
 * directory structure with proper separation of concerns.
 * 
 * IMPORTANT: This file is maintained in the repository so it can be used 
 * for future reorganization needs. If you need to further restructure the
 * project in the future, you can modify and run this script again.
 * 
 * Usage:
 *   node reorganize-repo.js
 */

const fs = require('fs');
const path = require('path');

// Directory structure to create
const directories = [
  'src',
  'examples',
  'config',
  'data/input',
  'data/templates',
  'data/output'
];

// Files to move with their source and destination paths
const filesToMove = [
  { from: 'excel-remapper.js', to: 'src/excel-remapper.js' },
  { from: 'advanced-remapper.js', to: 'src/advanced-remapper.js' },
  { from: 'demo-remapper.js', to: 'examples/demo-remapper.js' },
  { from: 'test-remapper.js', to: 'examples/test-remapper.js' },
  { from: 'mapping-config.json', to: 'config/mapping-config.json' },
  { from: 'source-data.csv', to: 'data/input/source-data.csv' },
  { from: 'template.csv', to: 'data/templates/template.csv' },
  { from: 'output.csv', to: 'data/output/output.csv' },
  { from: 'remapped-output.csv', to: 'data/output/remapped-output.csv' }
];

// Files that need import/require path updates
const fileUpdates = [
  {
    file: 'src/advanced-remapper.js',
    replacements: [
      {
        from: "require('./excel-remapper')",
        to: "require('./excel-remapper')" // Path stays the same in same directory
      }
    ]
  },
  {
    file: 'examples/demo-remapper.js',
    replacements: [
      {
        from: "require('./advanced-remapper')",
        to: "require('../src/advanced-remapper')"
      },
      {
        from: "const TEMPLATE_FILE = 'template.csv';",
        to: "const TEMPLATE_FILE = '../data/templates/template.csv';"
      },
      {
        from: "const INPUT_FILE = 'source-data.csv';",
        to: "const INPUT_FILE = '../data/input/source-data.csv';"
      },
      {
        from: "const CONFIG_FILE = 'mapping-config.json';",
        to: "const CONFIG_FILE = '../config/mapping-config.json';"
      },
      {
        from: "const OUTPUT_FILE = 'remapped-output.csv';",
        to: "const OUTPUT_FILE = '../data/output/remapped-output.csv';"
      }
    ]
  },
  {
    file: 'examples/test-remapper.js',
    replacements: [
      {
        from: "require('./advanced-remapper')",
        to: "require('../src/advanced-remapper')"
      },
      {
        from: "const TEMPLATE_FILE = 'template.csv';",
        to: "const TEMPLATE_FILE = '../data/templates/template.csv';"
      },
      {
        from: "const INPUT_FILE = 'source-data.csv';",
        to: "const INPUT_FILE = '../data/input/source-data.csv';"
      },
      {
        from: "const CONFIG_FILE = 'mapping-config.json';",
        to: "const CONFIG_FILE = '../config/mapping-config.json';"
      },
      {
        from: "const OUTPUT_FILE = 'remapped-output.csv';",
        to: "const OUTPUT_FILE = '../data/output/remapped-output.csv';"
      }
    ]
  },
  {
    file: 'package.json',
    replacements: [
      {
        from: '"main": "advanced-remapper.js"',
        to: '"main": "src/advanced-remapper.js"'
      }
    ]
  }
];

// Create directory structure
console.log('Creating directory structure...');
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
});

// Move files to their new locations
console.log('\nMoving files to new locations...');
filesToMove.forEach(fileMove => {
  if (fs.existsSync(fileMove.from)) {
    try {
      const fileContent = fs.readFileSync(fileMove.from, 'utf8');
      fs.writeFileSync(fileMove.to, fileContent);
      console.log(`Moved: ${fileMove.from} -> ${fileMove.to}`);
    } catch (error) {
      console.error(`Error moving ${fileMove.from}: ${error.message}`);
    }
  } else {
    console.warn(`Source file not found: ${fileMove.from}`);
  }
});

// Update file imports and paths
console.log('\nUpdating file import paths...');
fileUpdates.forEach(update => {
  if (fs.existsSync(update.file)) {
    try {
      let content = fs.readFileSync(update.file, 'utf8');
      
      update.replacements.forEach(replacement => {
        if (content.includes(replacement.from)) {
          content = content.replace(replacement.from, replacement.to);
          console.log(`Updated in ${update.file}: ${replacement.from} -> ${replacement.to}`);
        } else {
          console.warn(`String not found in ${update.file}: "${replacement.from}"`);
        }
      });
      
      fs.writeFileSync(update.file, content);
    } catch (error) {
      console.error(`Error updating ${update.file}: ${error.message}`);
    }
  } else {
    console.warn(`File not found for updating: ${update.file}`);
  }
});

// Update README.md to reflect the new structure
console.log('\nUpdating README.md...');
if (fs.existsSync('README.md')) {
  try {
    const readmeContent = fs.readFileSync('README.md', 'utf8');
    
    // Add new project structure section or update existing one
    const structureSection = `
## Project Structure

\`\`\`
├── src/                      # Source code
│   ├── excel-remapper.js     # Core functionality
│   ├── advanced-remapper.js  # Config-based extension
│
├── examples/                 # Example implementations
│   ├── demo-remapper.js      # Simple demo script
│   ├── test-remapper.js      # Test implementation
│
├── config/                   # Configuration files
│   ├── mapping-config.json   # Example mapping configuration
│
├── data/                     # Data files
│   ├── input/                # Input data
│   │   ├── source-data.csv   # Example input data
│   ├── templates/            # Template files
│   │   ├── template.csv      # Output template
│   ├── output/               # Generated output
│       ├── output.csv        # Sample output
│       ├── remapped-output.csv # Generated output from examples
\`\`\``;

    // Check if structure section already exists
    if (readmeContent.includes('## Project Structure')) {
      // Replace existing structure section
      const updatedReadme = readmeContent.replace(
        /## Project Structure[\s\S]*?```[\s\S]*?```/m,
        structureSection
      );
      fs.writeFileSync('README.md', updatedReadme);
    } else {
      // Add structure section before ## How It Works if it exists
      if (readmeContent.includes('## How It Works')) {
        const updatedReadme = readmeContent.replace(
          '## How It Works',
          `${structureSection}\n\n## How It Works`
        );
        fs.writeFileSync('README.md', updatedReadme);
      } else {
        // Otherwise append to the end
        const updatedReadme = readmeContent + '\n\n' + structureSection;
        fs.writeFileSync('README.md', updatedReadme);
      }
    }
    
    console.log('README.md updated with new project structure');
  } catch (error) {
    console.error(`Error updating README.md: ${error.message}`);
  }
} else {
  console.warn('README.md not found');
}

// Update running instructions
console.log('\nUpdating running examples instructions...');
if (fs.existsSync('examples/demo-remapper.js')) {
  try {
    let demoContent = fs.readFileSync('examples/demo-remapper.js', 'utf8');
    
    // Add a comment about how to run the demo from the project root
    if (!demoContent.includes('How to run this demo')) {
      const runningInstructions = `/**
 * Simple Demo script for the Excel/CSV Data Remapper
 * 
 * This script demonstrates how to use the remapper with a limited set of records.
 * 
 * How to run this demo:
 * From the project root directory:
 *   node examples/demo-remapper.js
 */`;
      
      demoContent = demoContent.replace(
        /\/\*\*[\s\S]*?\*\//,
        runningInstructions
      );
      
      fs.writeFileSync('examples/demo-remapper.js', demoContent);
      console.log('Added running instructions to demo-remapper.js');
    }
  } catch (error) {
    console.error(`Error updating demo-remapper.js: ${error.message}`);
  }
}

// Clean up original files after successful move (optional - uncomment if desired)
/*
console.log('\nCleaning up original files...');
filesToMove.forEach(fileMove => {
  if (fs.existsSync(fileMove.from) && fs.existsSync(fileMove.to)) {
    try {
      fs.unlinkSync(fileMove.from);
      console.log(`Removed original file: ${fileMove.from}`);
    } catch (error) {
      console.error(`Error removing ${fileMove.from}: ${error.message}`);
    }
  }
});
*/

console.log('\nRepository reorganization completed successfully!');
console.log('Note: Original files have been kept. Once you verify everything works correctly,');
console.log('you may want to manually delete the original files.');