const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'components');
const pagesPath = path.join(__dirname, 'pages');

const regexesToRemove = [
    /\s*shadow-\w+/g,
    /\s*hover:shadow-\w+/g,
    /\s*hover:scale-\[\d+\.\d+\]/g,
    /\s*hover:scale-\d+/g,
    /\s*hover:-translate-y-\d+(\.\d+)?/g,
    /\s*active:scale-\d+/g,
    /\s*active:scale-\[\d+\.\d+\]/g,
    /\s*transform\s+/g,
    /\s*transition-all\s+/g,
    /\s*transition\s+/g,
    /\s*transition-transform\s+/g,
    /\s*duration-\d+\s+/g,
    /\s*hover:bg-\w+-\d+\/\d+\s+/g,
    /\s*hover:border-\w+-\d+\/\d+\s+/g,
    /\s*hover:text-\w+(-\d+)?\s+/g
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Simple search and replace for button-like elements containing btn-glass
            // Actually, we can just strip these classes from any className string if it has btn-glass
            content = content.replace(/className=(["'{`])(.*?btn-glass-.*?)(["'`}])/g, (match, p1, p2, p3) => {
                let newClasses = p2;
                for (const rx of regexesToRemove) {
                    newClasses = newClasses.replace(rx, ' ');
                }
                // cleanup multiple spaces
                newClasses = newClasses.replace(/\s+/g, ' ').trim();
                if (p2 !== newClasses) {
                    modified = true;
                }
                return `className=${p1}${newClasses}${p3}`;
            });

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDirectory(directoryPath);
processDirectory(pagesPath);
console.log("Cleanup complete!");
