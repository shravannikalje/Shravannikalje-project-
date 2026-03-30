const themeToggle = document.getElementById("themeToggle");
const body = document.body;
const DEFAULT_GITHUB_BACKEND = "https://ciit-backend.onrender.com";
function resolveApiBaseUrl() {
	const configured = String(window.CIIT_CONFIG?.apiBaseUrl || "").trim().replace(/\/$/, "");
	if (configured) return configured;

	const { hostname, port, protocol } = window.location;
	if (hostname.endsWith("github.io")) {
		return DEFAULT_GITHUB_BACKEND;
	}

	if (protocol === "file:") {
		return "http://localhost:3000";
	}

	if ((hostname === "localhost" || hostname === "127.0.0.1") && port && port !== "3000") {
		return `http://${hostname}:3000`;
	}

	return "";
}

const API_BASE_URL = resolveApiBaseUrl();
const apiUrl = (path) => `${API_BASE_URL}${path}`;

const DEFAULT_SITE_CONTENT = {
	admissionText: "🎓 Admission Open Now • Apply Today • Limited Seats",
	hero: {
		badge: "🚀 Career Launchpad Since 2010",
		title: "Learn. Build. Get Placed.",
		subtitle: "Live projects + interview preparation + placement support",
	},
	highlights: [
		"10,000+ Students Trained",
		"500+ Placement Drives",
		"15+ Career-Oriented Courses",
		"4.8/5 Learner Rating",
	],
	courses: [
		{ name: ".NET Full Stack", duration: "6 Months • Beginner to Advanced", modules: ["C# Fundamentals", "ASP.NET Core Web API", "Entity Framework + SQL Server"] },
		{ name: "Java Full Stack", duration: "6 Months • Industry Track", modules: ["Core Java + OOP", "Spring Boot + REST API", "Hibernate + MySQL"] },
		{ name: "Python Full Stack", duration: "6 Months • Project Based", modules: ["Python Core + Advanced", "Django/Flask", "Database Integration"] },
	],
	futureDirections: [
		"Industry 4.0 & Innovation Centers",
		"Global Skill Development",
		"Placement Expansion",
		"Future‑Ready Vision",
	],
	officers: [{ name: "CIIT Coordinator", role: "Operations" }],
	festivals: ["Tech Fest", "Annual Project Expo"],
	placements: [
		{ name: "Rupesh Dhabarde", company: "Perpetituut Technosoft", technology: "Dot Net", package: "6.2 LPA" },
	],
};

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
const courseGrid = document.getElementById("courseGrid");
const highlightStrip = document.getElementById("highlightStrip");
const futureGrid = document.getElementById("futureGrid");
const officersGrid = document.getElementById("officersGrid");
const festivalsGrid = document.getElementById("festivalsGrid");
const placementsTable = document.getElementById("placementsTable");
const admissionText = document.getElementById("admissionText");
const heroBadgeText = document.getElementById("heroBadgeText");
const heroTitle = document.getElementById("heroTitle");
const heroSubtitleText = document.getElementById("heroSubtitleText");
const searchFeedback = document.getElementById("searchFeedback");
const syllabusPanel = document.getElementById("syllabusPanel");
const syllabusCourseTitle = document.getElementById("syllabusCourseTitle");
const syllabusMeta = document.getElementById("syllabusMeta");
const syllabusList = document.getElementById("syllabusList");
const downloadSyllabusBtn = document.getElementById("downloadSyllabusBtn");
const chooseCourseBtn = document.getElementById("chooseCourseBtn");
const enrollCourseSelect = document.getElementById("course");
const status = document.getElementById("formStatus");

let selectedCourseName = "";
let courseCards = [];
let syllabusData = {};
let placementChart = null;

function normalizeSiteContent(content) {
	const payload = content && typeof content === "object" ? content : {};
	return {
		...DEFAULT_SITE_CONTENT,
		...payload,
		hero: {
			...DEFAULT_SITE_CONTENT.hero,
			...(payload.hero || {}),
		},
		courses: Array.isArray(payload.courses) && payload.courses.length ? payload.courses : DEFAULT_SITE_CONTENT.courses,
		futureDirections: Array.isArray(payload.futureDirections) ? payload.futureDirections : DEFAULT_SITE_CONTENT.futureDirections,
		highlights: Array.isArray(payload.highlights) && payload.highlights.length ? payload.highlights : DEFAULT_SITE_CONTENT.highlights,
		officers: Array.isArray(payload.officers) ? payload.officers : DEFAULT_SITE_CONTENT.officers,
		festivals: Array.isArray(payload.festivals) ? payload.festivals : DEFAULT_SITE_CONTENT.festivals,
		placements: Array.isArray(payload.placements) && payload.placements.length ? payload.placements : DEFAULT_SITE_CONTENT.placements,
	};
}

async function loadSiteContent() {
	try {
		const response = await fetch(apiUrl("/api/site-content"));
		const payload = await response.json();
		if (!response.ok) {
			return normalizeSiteContent(DEFAULT_SITE_CONTENT);
		}
		return normalizeSiteContent(payload.content || DEFAULT_SITE_CONTENT);
	} catch {
		return normalizeSiteContent(DEFAULT_SITE_CONTENT);
	}
}

function renderHighlights(items) {
	highlightStrip.innerHTML = "";
	items.forEach((item) => {
		const card = document.createElement("div");
		card.className = "brand-item";
		card.textContent = item;
		highlightStrip.appendChild(card);
	});
}

function renderFutureDirections(items) {
	futureGrid.innerHTML = "";
	items.forEach((item) => {
		const card = document.createElement("article");
		card.className = "card";
		card.textContent = item;
		futureGrid.appendChild(card);
	});
}

function renderOfficers(items) {
	officersGrid.innerHTML = "";
	if (!items.length) {
		officersGrid.innerHTML = '<article class="card">No officers added yet.</article>';
		return;
	}

	items.forEach((item) => {
		const card = document.createElement("article");
		card.className = "card";
		const name = typeof item === "string" ? item : item?.name;
		const role = typeof item === "string" ? "" : item?.role;
		const heading = document.createElement("h3");
		heading.textContent = name || "Officer";
		card.appendChild(heading);
		if (role) {
			const roleText = document.createElement("p");
			roleText.textContent = role;
			card.appendChild(roleText);
		}
		officersGrid.appendChild(card);
	});
}

function renderFestivals(items) {
	festivalsGrid.innerHTML = "";
	if (!items.length) {
		festivalsGrid.innerHTML = '<article class="card">No festival/events added yet.</article>';
		return;
	}

	items.forEach((item) => {
		const card = document.createElement("article");
		card.className = "card";
		card.textContent = item;
		festivalsGrid.appendChild(card);
	});
}

function buildSyllabusData(courses) {
	const map = {};
	courses.forEach((course) => {
		if (!course?.name) return;
		map[course.name] = {
			duration: course.duration || "Duration details coming soon",
			modules: Array.isArray(course.modules) && course.modules.length
				? course.modules
				: ["Module details coming soon"],
		};
	});
	return map;
}

function attachCourseCardEvents() {
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
}

function renderCourses(courses) {
	courseGrid.innerHTML = "";
	enrollCourseSelect.innerHTML = '<option value="">Select Course</option>';

	courses.forEach((course) => {
		const card = document.createElement("article");
		card.className = "card";
		card.dataset.course = course.name;
		card.textContent = course.name;
		courseGrid.appendChild(card);

		const option = document.createElement("option");
		option.value = course.name;
		option.textContent = course.name;
		enrollCourseSelect.appendChild(option);
	});

	courseCards = Array.from(document.querySelectorAll("#courseGrid .card"));
	attachCourseCardEvents();
}

function renderPlacements(placements) {
	placementsTable.innerHTML = "";
	if (!placements.length) {
		placementsTable.innerHTML = '<tr><td colspan="4">No placements added yet.</td></tr>';
		return;
	}

	const techCount = {};
	placements.forEach((item) => {
		const row = document.createElement("tr");
		[item.name || "-", item.company || "-", item.technology || "-", item.package || "-"]
			.forEach((value) => {
				const td = document.createElement("td");
				td.textContent = value;
				row.appendChild(td);
			});
		placementsTable.appendChild(row);
		const tech = item.technology || "Other";
		techCount[tech] = (techCount[tech] || 0) + 1;
	});

	const chartCanvas = document.getElementById("placementChart");
	if (chartCanvas && window.Chart) {
		if (placementChart) {
			placementChart.destroy();
		}

		placementChart = new window.Chart(chartCanvas, {
			type: "bar",
			data: {
				labels: Object.keys(techCount),
				datasets: [
					{
						label: "Placed Students",
						data: Object.values(techCount),
						backgroundColor: ["#2563eb", "#8b5cf6", "#ef4444", "#14b8a6", "#f59e0b", "#ec4899"],
						borderRadius: 8,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				plugins: { legend: { display: false } },
				scales: {
					y: {
						beginAtZero: true,
						ticks: { stepSize: 1 },
					},
				},
			},
		});
	}
}

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
		const response = await fetch(apiUrl("/api/enrollments"), {
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

async function initDynamicWebsiteContent() {
	const content = await loadSiteContent();
	admissionText.textContent = content.admissionText;
	heroBadgeText.textContent = content.hero.badge;
	heroTitle.textContent = content.hero.title;
	heroSubtitleText.textContent = content.hero.subtitle;
	renderHighlights(content.highlights);
	renderCourses(content.courses);
	renderFutureDirections(content.futureDirections);
	renderOfficers(content.officers);
	renderFestivals(content.festivals);
	renderPlacements(content.placements);
	syllabusData = buildSyllabusData(content.courses);
}

initDynamicWebsiteContent();
