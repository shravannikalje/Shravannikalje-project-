const themeToggle = document.getElementById("themeToggle");
const body = document.body;

const savedTheme = localStorage.getItem("ciit-theme");
if (savedTheme === "dark") {
	body.classList.add("dark");
	themeToggle.textContent = "☀️";
}

themeToggle?.addEventListener("click", () => {
	body.classList.toggle("dark");
	const isDark = body.classList.contains("dark");
	themeToggle.textContent = isDark ? "☀️" : "🌙";
	localStorage.setItem("ciit-theme", isDark ? "dark" : "light");
});

const searchInput = document.getElementById("courseSearch");
const searchButton = document.getElementById("searchButton");
const courseCards = Array.from(document.querySelectorAll("#courseGrid .card"));
const searchFeedback = document.getElementById("searchFeedback");
const syllabusPanel = document.getElementById("syllabusPanel");
const syllabusCourseTitle = document.getElementById("syllabusCourseTitle");
const syllabusMeta = document.getElementById("syllabusMeta");
const syllabusList = document.getElementById("syllabusList");
const downloadSyllabusBtn = document.getElementById("downloadSyllabusBtn");
const chooseCourseBtn = document.getElementById("chooseCourseBtn");
const enrollCourseSelect = document.getElementById("course");
let selectedCourseName = "";

const syllabusData = {
	".NET Full Stack": {
		duration: "6 Months • Beginner to Advanced",
		modules: ["C# Fundamentals", "ASP.NET Core Web API", "Entity Framework + SQL Server", "Angular/React Frontend", "Authentication + Deployment"],
	},
	"Java Full Stack": {
		duration: "6 Months • Industry Track",
		modules: ["Core Java + OOP", "Spring Boot + REST API", "Hibernate + MySQL", "React Frontend", "Microservices Basics"],
	},
	"Python Full Stack": {
		duration: "6 Months • Project Based",
		modules: ["Python Core + Advanced", "Django/Flask", "Database Integration", "Frontend Essentials", "Testing + Deployment"],
	},
	"MEAN Stack": {
		duration: "5 Months • Web App Focus",
		modules: ["MongoDB", "Express.js API", "Angular UI", "Node.js Backend", "JWT + CI/CD"],
	},
	"MERN Stack": {
		duration: "5 Months • Startup Stack",
		modules: ["MongoDB", "Express.js", "React.js", "Node.js", "State Management + Deployment"],
	},
	"Software Testing": {
		duration: "4 Months • Manual + Automation",
		modules: ["STLC & Bug Lifecycle", "Test Case Design", "Selenium WebDriver", "API Testing (Postman)", "Performance & QA Reports"],
	},
	"Data Science & Analytics": {
		duration: "6 Months • Data Career Path",
		modules: ["Python for Data", "Pandas + NumPy", "Visualization", "Machine Learning Basics", "Capstone Analytics Project"],
	},
	"Digital Marketing": {
		duration: "3 Months • Practical Campaigns",
		modules: ["SEO + SEM", "Social Media Marketing", "Google Ads", "Content Strategy", "Analytics & Reporting"],
	},
	"Cloud Computing": {
		duration: "4 Months • Azure/AWS Basics",
		modules: ["Cloud Fundamentals", "Virtual Machines", "Storage + Networking", "DevOps Intro", "Cloud Deployment"],
	},
	ReactJS: {
		duration: "3 Months • Frontend Specialization",
		modules: ["JSX + Components", "Hooks", "Routing", "State Management", "API Integration"],
	},
	Angular: {
		duration: "3 Months • Frontend Framework",
		modules: ["TypeScript Basics", "Components + Services", "Routing", "Forms + Validation", "Build + Deploy"],
	},
	DBA: {
		duration: "3 Months • Database Admin",
		modules: ["SQL Administration", "Backup & Recovery", "Performance Tuning", "Security & Roles", "Monitoring"],
	},
	RDBMS: {
		duration: "2.5 Months • SQL Foundation",
		modules: ["Normalization", "SQL Queries", "Joins + Views", "Indexes", "Stored Procedures"],
	},
	"C++ Programming": {
		duration: "2 Months • Strong Fundamentals",
		modules: ["Syntax + Logic", "OOP in C++", "STL", "File Handling", "Mini Projects"],
	},
	"Real Time Project": {
		duration: "1.5 Months • Hands-On",
		modules: ["Requirement Analysis", "Design + Planning", "Coding Sprint", "Testing + Review", "Final Demo + Interview Prep"],
	},
};

function renderSyllabus(courseName) {
	const data = syllabusData[courseName];
	if (!data) return;
	selectedCourseName = courseName;

	syllabusCourseTitle.textContent = `${courseName} - Syllabus`;
	syllabusMeta.textContent = data.duration;
	syllabusList.innerHTML = data.modules
		.map((module, index) => `
			<li>
				<details class="module-item" ${index === 0 ? "open" : ""}>
					<summary>Module ${index + 1}: ${module}</summary>
					<p>Hands-on practice, assignments, and interview-focused questions for this module.</p>
				</details>
			</li>
		`)
		.join("");
	syllabusPanel.classList.add("syllabus-visible");
	downloadSyllabusBtn.disabled = false;
	chooseCourseBtn.disabled = false;
}

function downloadSyllabusPdf() {
	if (!selectedCourseName || !window.jspdf?.jsPDF) return;
	const { jsPDF } = window.jspdf;
	const doc = new jsPDF();
	const data = syllabusData[selectedCourseName];

	doc.setFontSize(16);
	doc.text("CIIT Training Institute", 14, 18);
	doc.setFontSize(13);
	doc.text(`${selectedCourseName} - Syllabus`, 14, 28);
	doc.setFontSize(11);
	doc.text(`Duration: ${data.duration}`, 14, 36);

	let y = 46;
	data.modules.forEach((module, index) => {
		doc.text(`${index + 1}. ${module}`, 14, y);
		y += 8;
	});

	doc.save(`${selectedCourseName.replace(/\s+/g, "-").toLowerCase()}-syllabus.pdf`);
}

function chooseCourseForEnrollment() {
	if (!selectedCourseName || !enrollCourseSelect) return;
	enrollCourseSelect.value = selectedCourseName;
	document.getElementById("enroll")?.scrollIntoView({ behavior: "smooth", block: "start" });
	status.textContent = `Selected course: ${selectedCourseName}`;
	status.style.color = "#2563eb";
}

courseCards.forEach((card) => {
	card.setAttribute("role", "button");
	card.setAttribute("tabindex", "0");
	card.classList.add("course-card");

	const selectCard = () => {
		courseCards.forEach((item) => item.classList.remove("card-active"));
		card.classList.add("card-active");
		renderSyllabus(card.dataset.course);
	};

	card.addEventListener("click", selectCard);
	card.addEventListener("keydown", (event) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			selectCard();
		}
	});
});

function filterCourses() {
	const term = searchInput.value.trim().toLowerCase();
	let visibleCount = 0;

	courseCards.forEach((card) => {
		const courseName = card.dataset.course.toLowerCase();
		const isVisible = courseName.includes(term);
		card.style.display = isVisible ? "block" : "none";
		if (isVisible) visibleCount += 1;
	});

	if (!term) {
		searchFeedback.textContent = "";
		syllabusPanel.classList.remove("syllabus-hidden-by-filter");
		return;
	}

	searchFeedback.textContent = `${visibleCount} course(s) found for "${searchInput.value}"`;
	if (visibleCount === 0) {
		syllabusPanel.classList.add("syllabus-hidden-by-filter");
	} else {
		syllabusPanel.classList.remove("syllabus-hidden-by-filter");
	}
}

searchInput?.addEventListener("input", filterCourses);
searchButton?.addEventListener("click", filterCourses);
downloadSyllabusBtn?.addEventListener("click", downloadSyllabusPdf);
chooseCourseBtn?.addEventListener("click", chooseCourseForEnrollment);

const enrollForm = document.getElementById("enrollForm");
const status = document.getElementById("formStatus");

function isValidEmail(email) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

enrollForm?.addEventListener("submit", async (event) => {
	event.preventDefault();

	const name = document.getElementById("name").value.trim();
	const email = document.getElementById("email").value.trim();
	const phone = document.getElementById("phone").value.trim();
	const course = document.getElementById("course").value;

	if (name.length < 3) {
		status.textContent = "Please enter a valid full name.";
		status.style.color = "#ef4444";
		return;
	}

	if (!isValidEmail(email)) {
		status.textContent = "Please enter a valid email address.";
		status.style.color = "#ef4444";
		return;
	}

	if (!/^\d{10}$/.test(phone)) {
		status.textContent = "Phone number must be exactly 10 digits.";
		status.style.color = "#ef4444";
		return;
	}

	if (!course) {
		status.textContent = "Please select a course.";
		status.style.color = "#ef4444";
		return;
	}

	status.textContent = "Submitting your enrollment...";
	status.style.color = "#2563eb";

	try {
		const response = await fetch("/api/enrollments", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ name, email, phone, course }),
		});

		const payload = await response.json();

		if (!response.ok) {
			status.textContent = payload.message || "Could not submit enrollment right now.";
			status.style.color = "#ef4444";
			return;
		}

		status.textContent = `Thanks ${name}! Enrollment submitted successfully.`;
		status.style.color = "#16a34a";
		enrollForm.reset();
	} catch {
		status.textContent = "Server not available. Please run backend and try again.";
		status.style.color = "#ef4444";
	}
});

const placementRows = Array.from(document.querySelectorAll("#placementsTable tr"));
const techCount = {};

placementRows.forEach((row) => {
	const technology = row.children[2]?.textContent?.trim();
	if (!technology) return;
	techCount[technology] = (techCount[technology] || 0) + 1;
});

const chartCanvas = document.getElementById("placementChart");
if (chartCanvas && window.Chart) {
	new window.Chart(chartCanvas, {
		type: "bar",
		data: {
			labels: Object.keys(techCount),
			datasets: [
				{
					label: "Placed Students",
					data: Object.values(techCount),
					backgroundColor: [
						"#2563eb",
						"#8b5cf6",
						"#ef4444",
						"#14b8a6",
						"#f59e0b",
						"#ec4899",
					],
					borderRadius: 8,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: true,
			plugins: {
				legend: {
					display: false,
				},
			},
			scales: {
				y: {
					beginAtZero: true,
					ticks: {
						stepSize: 1,
					},
				},
			},
		},
	});
}
