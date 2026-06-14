import * as fs from 'fs';
import * as path from 'path';

const htmlPath = path.resolve(__dirname, '../RajaJeevanKMaduri_CustomGPTs_AIAgents.html');
const outputPath = path.resolve(__dirname, './data/default-agents.json');

function main() {
  console.log(`Reading original HTML from: ${htmlPath}`);
  if (!fs.existsSync(htmlPath)) {
    console.error('HTML file not found!');
    process.exit(1);
  }

  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  // Regex to extract content between REGISTRY_START and REGISTRY_END
  const regex = /\/\* REGISTRY_START \*\/([\s\S]*?)\/\* REGISTRY_END \*\//;
  const match = htmlContent.match(regex);
  
  if (!match || !match[1]) {
    console.error('Could not find registry markers in HTML!');
    process.exit(1);
  }

  const rawJs = match[1].trim();
  
  // Extract the array content. Since it is written as `let registry = [ ... ];`
  // We can strip `let registry =` and the ending semicolon to make it parseable JSON.
  let arrayStr = rawJs.replace(/let\s+registry\s*=/, '').trim();
  if (arrayStr.endsWith(';')) {
    arrayStr = arrayStr.slice(0, -1).trim();
  }

  try {
    // Parse the array
    const registry = JSON.parse(arrayStr);
    
    // Map the 4 array indexes to category IDs
    const categories = ['plan', 'do', 'check', 'act'];
    const formattedData = categories.map((catName, index) => {
      return {
        category: catName,
        agents: registry[index] || []
      };
    });

    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(formattedData, null, 2), 'utf8');
    console.log(`Successfully parsed and saved ${formattedData.reduce((acc, c) => acc + c.agents.length, 0)} agents to ${outputPath}`);
  } catch (err: any) {
    console.error('Failed to parse registry javascript block as JSON:', err.message);
    // Fallback: evaluate the code using simple eval in sandbox context
    try {
      console.log('Attempting JS evaluation fallback...');
      let evaluatedRegistry: any;
      const sandboxFn = new Function(`${rawJs}; return registry;`);
      evaluatedRegistry = sandboxFn();
      
      const categories = ['plan', 'do', 'check', 'act'];
      const formattedData = categories.map((catName, index) => {
        return {
          category: catName,
          agents: evaluatedRegistry[index] || []
        };
      });
      
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(outputPath, JSON.stringify(formattedData, null, 2), 'utf8');
      console.log(`Fallback evaluation succeeded. Saved to ${outputPath}`);
    } catch (fallbackErr: any) {
      console.error('Fallback evaluation also failed:', fallbackErr.message);
      process.exit(1);
    }
  }
}

main();
