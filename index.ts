import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import markdownit from 'markdown-it';
import { join } from 'node:path';
import chokidar from 'chokidar';

const md = markdownit()
const app = express();
const server = createServer(app);
const io = new Server(server);
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const port = config.port || 3000;

// Middleware
app.use(express.static('public'));

// Routes
app.get('/*', (req: any, res: any) => {
    const decodedPath = decodeURIComponent(req.path);
    const filePath = path.join(__dirname, 'public', decodedPath + '.md');
    const fileName = path.basename(filePath);
    fs.readFile(filePath, 'utf8', (err: any, data: string) => {
        if (err) {
            handle_file_error(decodedPath, req, res);
        } else {
            res.send(parse_to_html(`# ${fileName.slice(0, -3)} \n` + data));
        }
    });
});

// Helper functions
function parse_to_html(data: string) {
    let workingData = md.render(data);
    const template = fs.readFileSync(path.join(__dirname, 'public/.mk', 'template.html'), 'utf8');
    const firstHeader = workingData.match(/<h1>(.*?)<\/h1>/);
    workingData = template.replace(/\{\{title\}\}/g, firstHeader ? firstHeader[1] : 'Untitled')
                          .replace('{{content}}', workingData);
    return workingData;
}

function handle_file_error(decodedPath: string, req: any, res: any) {
    const folderPath = path.join(__dirname, 'public', decodedPath);
    if (fs.existsSync(folderPath)) {
        send_folder_contents(folderPath, req, res);
    } else {
        res.redirect('/');
    }
}

function send_folder_contents(folderPath: string, req: any, res: any) {
    const files = fs.readdirSync(folderPath);
    let html = '<ul>';
    files.forEach((file: string) => {
        if (file.endsWith('.md')) {
            file = file.slice(0, -3);
        }
        if (!file.startsWith('.')) {
            html += `<li><a href="${encodeURI(path.join(decodeURIComponent(req.path), file))}">${file}</a></li>`;
        }
    });
    html += '</ul>';
    const template = fs.readFileSync(path.join(__dirname, 'public/.mk', 'template.html'), 'utf8');
    html = template.replace('{{content}}', html)
                   .replace(/\{\{title\}\}/g, 'Folder Contents');
    res.send(html);
}

// Start server
server.listen(port, () => {
    console.log(`Markdown listening on port ${port}`);
});

const watcher = chokidar.watch(path.join(__dirname, 'public'), {
    ignored: /(^|[\/\\])\../,
    persistent: true
});

watcher
    .on('add', (filePath: any) => {
        console.log(`File ${filePath} has been added`);
        io.emit('refresh');
    })
    .on('change', (filePath: any) => {
        console.log(`File ${filePath} has been changed`);
        io.emit('refresh');
    })
    .on('unlink', (filePath: any) => {
        console.log(`File ${filePath} has been removed`);
        io.emit('refresh');
    })
    .on('addDir', (dirPath: any) => {
        console.log(`Directory ${dirPath} has been added`);
        io.emit('refresh');
    })
    .on('unlinkDir', (dirPath: any) => {
        console.log(`Directory ${dirPath} has been removed`);
        io.emit('refresh');
    })
    .on('error', (error: any) => console.log(`Watcher error: ${error}`));