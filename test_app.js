const fs = require('fs');
let JOBS = [{id:1, type:'job', title:'AI/ML Engineer'}]; // mock data
let COMPANIES = []; // mock data

// mock DOM
global.window = { location: { origin: 'http://localhost', pathname: '/index.html', search: '' } };
global.document = {
  getElementById: (id) => {
    return { style: {}, classList: { toggle: ()=>{} }, innerHTML: '', textContent: '', map: ()=>[] };
  },
  querySelectorAll: () => [],
  documentElement: { style: { setProperty: ()=>{} } }
};
global.localStorage = { getItem: ()=>null, setItem: ()=>{} };
global.URLSearchParams = class { constructor() {} get() { return null; } };

const code = fs.readFileSync('app.js', 'utf8');
try {
  eval(code);
  console.log("EVAL SUCCESS");
} catch(e) {
  console.log("EVAL ERROR:", e);
}
