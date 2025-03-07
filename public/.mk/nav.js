const nav_el = document.getElementById('nav');
const file_path = window.location.pathname.split('/').slice(1).join('/');
const paths = file_path.split('/');

const New_El = function(el_type, el_parent, el_content) {
    const new_el = document.createElement(el_type);
    new_el.textContent = el_content;
    el_parent.appendChild(new_el);
    return new_el;
};


if (paths[0]) {
    New_El('span', nav_el, ' / ');
}
let currentPath = '';
paths.forEach((path, index) => {
    currentPath += '/' + path;
    path_text = path.replace('.html', ' ')
    const link = New_El('a', nav_el, path_text.replace(/%20/g, ' '));
    link.href = currentPath;
    if (index < paths.length - 1) {
        New_El('span', nav_el, ' / ');
    }
});