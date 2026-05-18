// Sync package.json versions with package-lock.json
const fs = require('fs');

console.log('');
console.log('Checking for version updates...');

if (!fs.existsSync('package.json')) {
    console.log('Error: package.json not found!');
    process.exit(1);
}

if (!fs.existsSync('package-lock.json')) {
    console.log('Error: package-lock.json not found!');
    process.exit(1);
}

const pkg = fs.readFileSync('package.json', 'utf8');
const lock = fs.readFileSync('package-lock.json', 'utf8');

let updated = [];
let newPkg = pkg;

const depPattern = /"([^"]+)":\s*"([\^~])(\d+\.\d+\.\d+[^"]*)"/g;
let m;

while ((m = depPattern.exec(pkg)) !== null) {
    const name = m[1];
    const prefix = m[2];
    const curVer = m[3];
    const fullCur = prefix + curVer;
    
    const lockPattern = new RegExp(
        '"node_modules/' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 
        '":\\s*\\{[^}]*"version":\\s*"(\\d+\\.\\d+\\.\\d+[^"]*)"'
    );
    
    const lockMatch = lock.match(lockPattern);
    
    if (lockMatch && curVer !== lockMatch[1]) {
        const newVer = prefix + lockMatch[1];
        newPkg = newPkg.replace(
            '"' + name + '": "' + fullCur + '"',
            '"' + name + '": "' + newVer + '"'
        );
        updated.push({ name, old: fullCur, new: newVer });
    }
}

if (updated.length > 0) {
    fs.writeFileSync('package.json', newPkg, 'utf8');
    console.log('');
    console.log('========================================');
    console.log('  Updated package.json versions:');
    console.log('========================================');
    updated.forEach(u => console.log('  ' + u.name + ': ' + u.old + ' -> ' + u.new));
    console.log('========================================');
    console.log('');
} else {
    console.log('');
    console.log('All package.json versions are already in sync.');
    console.log('');
}
