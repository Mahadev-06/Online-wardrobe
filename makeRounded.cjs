const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'components');
const pagesPath = path.join(__dirname, 'pages');

const regexesToReplace = [
    { regex: /\brounded-md\b/g, replacement: 'rounded-2xl' },
    { regex: /\brounded-lg\b/g, replacement: 'rounded-3xl' },
    { regex: /\brounded-xl\b/g, replacement: 'rounded-3xl' },
    { regex: /\brounded-2xl\b/g, replacement: 'rounded-[2rem]' },
    { regex: /\brounded-3xl\b/g, replacement: 'rounded-[2.5rem]' },
];

function processDirectory(dir) {
    fs.readdir(dir, (err, files) => {
        if (err) return console.log('Unable to scan directory: ' + err); 
        
        files.forEach((file) => {
            const filePath = path.join(dir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return console.log(err);
                
                if (stats.isDirectory()) {
                    processDirectory(filePath);
                } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
                    fs.readFile(filePath, 'utf8', (err, data) => {
                        if (err) return console.log(err);
                        
                        let result = data;
                        regexesToReplace.forEach(r => {
                            result = result.replace(r.regex, r.replacement);
                        });
                        
                        if (result !== data) {
                            fs.writeFile(filePath, result, 'utf8', (err) => {
                                if (err) return console.log(err);
                                console.log(`Updated ${filePath}`);
                            });
                        }
                    });
                }
            });
        });
    });
}

processDirectory(directoryPath);
processDirectory(pagesPath);

// Also process App.tsx
const appPath = path.join(__dirname, 'App.tsx');
fs.readFile(appPath, 'utf8', (err, data) => {
    if (err) return console.log(err);
    let result = data;
    regexesToReplace.forEach(r => {
        result = result.replace(r.regex, r.replacement);
    });
    if (result !== data) {
        fs.writeFile(appPath, result, 'utf8', (err) => {
            if (err) return console.log(err);
            console.log(`Updated App.tsx`);
        });
    }
});
