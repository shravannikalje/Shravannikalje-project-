// Dark Mode Toggle
document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

// Course Search Filter
const searchInput = document.getElementById('searchInput');
const courseCards = Array.from(document.querySelectorAll('#courseGrid .card'));
searchInput?.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase();
  courseCards.forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});

// Enrollment Form Submit
document.getElementById('enrollForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  document.getElementById('formStatus').textContent = '✅ धन्यवाद! आम्ही लवकरच संपर्क करू.';
});

// Placements dataset (तुम्ही दिलेली संपूर्ण लिस्ट इथे टाकता येईल)
const placements = [
  { name: 'Rupesh Dhabarde', company: 'Perpetituut Technosoft', tech: 'Dot Net', package: '6.2 LPA' },
  { name: 'Akshay Pawar', company: 'Rabbit & Tortoise', tech: 'Dot Net', package: '3.5 LPA' },
  { name: 'Pratiksha Phadatare', company: 'Rabbit & Tortoise', tech: 'Dot Net', package: '3.5 LPA' },
  { name: 'Akash Supelkar', company: 'Avenitrinnovative', tech: 'Dot Net', package: '3.5 LPA' },
  // 👉 बाकी सर्व रेकॉर्ड्स इथे टाकता येतील
];

// Populate Placements Table
const tbody = document.getElementById('placementsTable');
placements.forEach(p => {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${p.name}</td>
    <td>${p.company}</td>
    <td>${p.tech}</td>
    <td>${p.package}</td>
  `;
  tbody.appendChild(tr);
});

// Chart.js Visualization
const techCounts = {};
placements.forEach(p => {
  const key = p.tech;
  if (!key) return;
  techCounts[key] = (techCounts[key] || 0) + 1;
});

const labels = Object.keys(techCounts);
const data = labels.map(l => techCounts[l]);

const ctx = document.getElementById('placementChart').getContext('2d');
new Chart(ctx, {
  type: 'bar',
  data: {
    labels,
    datasets: [{
      label: 'Placements by Technology',
      data,
      backgroundColor: '#3498db'
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  }
});
