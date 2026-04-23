const fs = require('fs');
const companies = ['Google India', 'Infosys', 'Flipkart', 'Microsoft India', 'Razorpay', 'Zomato', 'HCL', 'CRED', 'TCS', 'PhonePe', 'Swiggy', 'Meesho', 'Wipro', 'Paytm', 'Polygon', 'Zerodha', 'Ola', 'Freshworks', 'ShareChat', 'Unstop'];
const locations = ['Karnataka', 'Delhi (NCR)', 'Maharashtra', 'Telangana', 'Remote', 'Tamil Nadu'];
const roles = ['Software Engineer', 'Frontend Developer', 'Backend Engineer', 'Full Stack Developer', 'Data Scientist', 'Product Manager', 'UX Designer', 'DevOps Engineer', 'Machine Learning Engineer', 'Security Analyst'];
const categories = ['Engineering', 'Data Science', 'Product', 'Design', 'Marketing', 'Finance', 'HR', 'Sales', 'Security', 'Legal'];

let jobs = [];
let idCounter = 100;

for (let i = 0; i < 40; i++) {
  const company = companies[Math.floor(Math.random() * companies.length)];
  const location = locations[Math.floor(Math.random() * locations.length)];
  const role = roles[Math.floor(Math.random() * roles.length)];
  const isIntern = Math.random() > 0.8;
  const type = isIntern ? 'internship' : 'job';
  
  jobs.push({
    id: idCounter++,
    type: type,
    title: role + (isIntern ? ' Intern' : ''),
    company: company,
    location: location,
    posted: Math.floor(Math.random() * 5 + 1) + ' days ago',
    desc: `Join ${company} as a ${role} to build impactful products for millions of users.`,
    tags: ['Tech', 'Innovation', '2026'],
    category: 'Engineering',
    salary: isIntern ? '₹30K - ₹50K/month' : '₹10L - ₹30L PA',
    applyUrl: '#',
    isLive: true
  });
}

// Read data.js, find the JOBS array, and append these jobs.
let data = fs.readFileSync('data.js', 'utf8');
const jobsString = jobs.map(j => `  {id:${j.id},type:'${j.type}',title:'${j.title}',company:'${j.company}',location:'${j.location}',posted:'${j.posted}',desc:"${j.desc}",tags:['${j.tags.join("','")}'],category:'${j.category}',salary:'${j.salary}', applyUrl: '${j.applyUrl}', isLive: true}`).join(',\n');

data = data.replace('// INTERNSHIPS', jobsString + '\n  // INTERNSHIPS');
fs.writeFileSync('data.js', data);
