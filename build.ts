import path from 'path';
import fs from 'fs';
import markdownit from 'markdown-it';
import chokidar from 'chokidar';

const md = markdownit();
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const srcDir = config.public_path || path.join(__dirname, 'public');
const prefix = config.prefix ? String(config.prefix).replace(/^\/+|\/+$/g, '') : '';
const buildDir = path.join(__dirname, 'build', prefix);

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

// Helper functions
function parse_to_html(data: string, fileName: string, relativePath: string) {
    let workingData = md.render(data);
    let template = fs.readFileSync(path.join(srcDir, '.mk', 'template.html'), 'utf8');
    template = template.replace(/\{\{prefix\}\}/g, prefix ? '/' + prefix : '');
    // Ensure trailing slash for prefix if present, else just root
    template = template.replace(/\{\{prefix_slash\}\}/g, prefix ? '/' + prefix : '');
    const firstHeader = workingData.match(/<h1>(.*?)<\/h1>/);
    workingData = template.replace(/\{\{title\}\}/g, firstHeader ? firstHeader[1] : 'Untitled')
                          .replace('{{content}}', workingData);
    const htmlFileName = fileName.slice(0, -3) + '.html';
    const outputDir = path.join(buildDir, relativePath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(path.join(outputDir, htmlFileName), workingData, 'utf8');
}

function build_folder_contents(folderPath: string, relativePath: string = '') {
    const files = fs.readdirSync(folderPath);
    const outputDir = path.join(buildDir, relativePath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    files.forEach((file: string) => {
        const filePath = path.join(folderPath, file);
        const fileRelativePath = path.join(relativePath, file);
        if (fs.statSync(filePath).isDirectory()) {
            build_folder_contents(filePath, fileRelativePath);
        } else if (file.endsWith('.md')) {
            const data = fs.readFileSync(filePath, 'utf8');
            parse_to_html(data, file, relativePath);
        }
    });
}

function send_folder_contents(folderPath: string, relativePath: string) {
    // Add prefix to all links
    const files = fs.readdirSync(folderPath);
    let html = '<ul>';
    files.forEach((file: string) => {
        let displayFile = file;
        let linkFile = file;
        if (file.endsWith('.md')) {
            displayFile = file.slice(0, -3);
            linkFile = displayFile + '.html';
        }
        if (!file.startsWith('.')) {
            if (linkFile.endsWith('.html')) {
                html += `<li><a href="/${prefix ? prefix + '/' : ''}${encodeURI(path.join(decodeURIComponent(relativePath), linkFile))}">${displayFile}</a></li>`;
            } else {
                html += `<li><a href="/${prefix ? prefix + '/' : ''}${encodeURI(path.join(decodeURIComponent(relativePath), linkFile))}">${displayFile}</a></li>`;
            }
        }
    });
    html += '</ul>';
    let template = fs.readFileSync(path.join(srcDir, '.mk', 'template.html'), 'utf8');
    template = template.replace(/\{\{prefix\}\}/g, prefix ? '/' + prefix : '');
    template = template.replace(/\{\{prefix_slash\}\}/g, prefix ? '/' + prefix : '');
    html = template.replace('{{content}}', html)
                   .replace(/\{\{title\}\}/g, 'Folder Contents');
    const outputDir = path.join(buildDir, relativePath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(path.join(outputDir, 'index.html'), html, 'utf8');
    return html;
}

// Build initial files
build_folder_contents(srcDir);
// For every folder
function send_all_folder_contents(folderPath: string, relativePath: string = '') {
    send_folder_contents(folderPath, relativePath);
    const files = fs.readdirSync(folderPath);
    files.forEach((file: string) => {
        const filePath = path.join(folderPath, file);
        const fileRelativePath = path.join(relativePath, file);
        if (fs.statSync(filePath).isDirectory()) {
            send_all_folder_contents(filePath, fileRelativePath);
        }
    });
}

send_all_folder_contents(srcDir);

// Watch for changes
const watcher = chokidar.watch(srcDir, {
    persistent: true
});

watcher
    .on('add', (filePath: any) => {
        if (filePath.endsWith('.md')) {
            const data = fs.readFileSync(filePath, 'utf8');
            const relativePath = path.relative(srcDir, path.dirname(filePath));
            parse_to_html(`# ${path.basename(filePath).slice(0, -3)} \n` + data, path.basename(filePath), relativePath);
            console.log(`File ${filePath} has been added and built`);
        } else {
            // Clone the file
            const relativePath = path.relative(srcDir, path.dirname(filePath));
            const newFilePath = path.join(buildDir, relativePath, path.basename(filePath));
            fs.copyFileSync(filePath, newFilePath);
            console.log(`File ${filePath} has been added and built`);
        }
    })
    .on('addDir', (dirPath: any) => {
        console.log(`Directory ${dirPath} has been added`);
    })
    .on('error', (error: any) => console.log(`Watcher error: ${error}`))
    .on('ready', () => {
        console.log('\x1b[32m'+'Build Complete!');
        watcher.close();
    });