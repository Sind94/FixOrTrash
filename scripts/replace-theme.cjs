const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdir(dir, function (err, list) {
        if (err) return callback(err);
        let pending = list.length;
        if (!pending) return callback(null);
        list.forEach(function (file) {
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
                        if (!--pending) callback(null);
                    });
                } else {
                    if (file.endsWith('.jsx')) {
                        let content = fs.readFileSync(file, 'utf8');
                        const originalContent = content;

                        // Replace Classes
                        content = content.replace(/bg-yellow-400\b/g, 'bg-theme-primary');
                        content = content.replace(/text-yellow-400\b/g, 'text-theme-primary');
                        content = content.replace(/border-yellow-400\b/g, 'border-theme-primary');
                        content = content.replace(/bg-yellow-500\b/g, 'bg-theme-primary');
                        content = content.replace(/text-yellow-500\b/g, 'text-theme-primary');
                        content = content.replace(/border-yellow-500\b/g, 'border-theme-primary');

                        // Black variations -> theme-panel and theme-bg
                        content = content.replace(/bg-black\/40\b/g, 'bg-theme-panel');
                        content = content.replace(/bg-black\/50\b/g, 'bg-theme-panel');
                        content = content.replace(/bg-black\/30\b/g, 'bg-theme-panel');
                        content = content.replace(/bg-\[\#121212\]\b/g, 'bg-theme-panel');
                        content = content.replace(/bg-black\b/g, 'bg-theme-bg');

                        // Borders and panels
                        content = content.replace(/border-white\/10\b/g, 'border-theme-panelBorder');
                        content = content.replace(/border-white\/5\b/g, 'border-theme-panelBorder');
                        content = content.replace(/border-white\/20\b/g, 'border-theme-panelBorder');
                        content = content.replace(/border-gray-700\b/g, 'border-theme-panelBorder');
                        content = content.replace(/border-gray-600\b/g, 'border-theme-panelBorder');
                        content = content.replace(/border-gray-800\b/g, 'border-theme-panelBorder');

                        content = content.replace(/bg-white\/5\b/g, 'bg-theme-panel border border-theme-panelBorder');
                        content = content.replace(/bg-white\/10\b/g, 'bg-theme-panel brightness-110 border border-theme-panelBorder');

                        content = content.replace(/text-white\b/g, 'text-theme-text');
                        content = content.replace(/text-black\b/g, 'text-theme-primaryContent');

                        // Border Radius
                        content = content.replace(/rounded-xl\b/g, 'rounded-theme-btn');
                        content = content.replace(/rounded-2xl\b/g, 'rounded-theme-panel');
                        content = content.replace(/rounded-3xl\b/g, 'rounded-theme-panel');

                        // Fix for CheckIn and search that uses manual strings
                        content = content.replace(/yellow-400/g, 'theme-primary');

                        // Only write if changed
                        if (content !== originalContent) {
                            fs.writeFileSync(file, content, 'utf8');
                            console.log(`Updated ${file}`);
                        }
                    }
                    if (!--pending) callback(null);
                }
            });
        });
    });
}

walk('./src', function (err) {
    if (err) throw err;
    console.log('Finished replacing themes globally');
});
