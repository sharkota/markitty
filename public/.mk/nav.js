const nav_el = document.getElementById('nav');
const prefix = 'linux'; // Set this to match your config.json prefix
const file_path = window.location.pathname.split('/').slice(1).join('/');
let paths = file_path.split('/');

// Remove prefix from breadcrumb if present
if (paths[0] === prefix) {
    paths = paths.slice(1);
}

const New_El = function(el_type, el_parent, el_content) {
    const new_el = document.createElement(el_type);
    new_el.textContent = el_content;
    el_parent.appendChild(new_el);
    return new_el;
};

// Update root nav link to use prefix
const navRoot = document.getElementById('nav-root');
if (navRoot) {
    navRoot.href = prefix ? '/' + prefix : '/';
}

if (paths[0]) {
    New_El('span', nav_el, ' / ');
}
let currentPath = prefix ? '/' + prefix : '';
paths.forEach((path, index) => {
    currentPath += '/' + path;
    let path_text = path.replace('.html', ' ');
    const link = New_El('a', nav_el, path_text.replace(/%20/g, ' '));
    link.href = currentPath;
    if (index < paths.length - 1) {
        New_El('span', nav_el, ' / ');
    }
});