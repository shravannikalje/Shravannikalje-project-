const themeToggle = document.getElementById("themeToggle");
const body = document.body;

const ADMIN_STORAGE_KEY = "ciit-admin-pin";
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
const IS_GITHUB_PAGES = window.location.hostname.endsWith("github.io");

const adminLoginSection = document.getElementById("adminLoginSection");
const adminDashboardSection = document.getElementById("adminDashboardSection");
const adminRecordsSection = document.getElementById("adminRecordsSection");
const adminPinInput = document.getElementById("adminPin");
const adminLoginButton = document.getElementById("adminLoginButton");
const adminLoginStatus = document.getElementById("adminLoginStatus");
const adminLogoutButton = document.getElementById("adminLogoutButton");

const tableBody = document.getElementById("enrollmentTableBody");
const totalCount = document.getElementById("totalCount");
const totalVisitors = document.getElementById("totalVisitors");
const topCourse = document.getElementById("topCourse");
const latestEntry = document.getElementById("latestEntry");
const adminStatus = document.getElementById("adminStatus");
const exportCsvButton = document.getElementById("exportCsv");
const querySearchInput = document.getElementById("querySearch");
const visitorTrendChartCanvas = document.getElementById("visitorTrendChart");
const refreshNowBtn = document.getElementById("refreshNowBtn");
const serverLiveChip = document.getElementById("serverLiveChip");
const serverLiveDot = document.getElementById("serverLiveDot");
const serverLiveText = document.getElementById("serverLiveText");
const lastUpdatedText = document.getElementById("lastUpdatedText");
const adminToast = document.getElementById("adminToast");

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

if (IS_GITHUB_PAGES) {
	if (!API_BASE_URL) {
		adminLoginStatus.textContent = "GitHub Pages साठी config.js मध्ये apiBaseUrl set करा (उदा. Render URL).";
		adminLoginStatus.style.color = "#ef4444";
	}
}

let enrollmentCache = [];
let visitorChart = null;
let activeAdminPin = localStorage.getItem(ADMIN_STORAGE_KEY) || "";
let autoRefreshTimer = null;
let lastKnownEnrollmentCount = 0;

function toSafeText(value) {
	if (value === null || value === undefined) return "-";
	const str = String(value);
	return str
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function getSortedEnrollments(enrollments) {
	return [...(enrollments || [])].sort((a, b) => {
		const timeA = Date.parse(a?.createdAt || "") || 0;
		const timeB = Date.parse(b?.createdAt || "") || 0;
		return timeB - timeA;
	});
}

function showToast(message, type = "info") {
	if (!adminToast) return;
	adminToast.textContent = message;
	adminToast.classList.remove("toast-show", "toast-success", "toast-info", "toast-error");
	adminToast.classList.add("toast-show", `toast-${type}`);
	setTimeout(() => {
		adminToast.classList.remove("toast-show");
	}, 2800);
}

function animateRefreshPulse() {
	const cards = document.querySelectorAll(".stat-card");
	cards.forEach((card) => {
		card.classList.remove("pulse-on-refresh");
		void card.offsetWidth;
		card.classList.add("pulse-on-refresh");
	});
}

function setDashboardVisible(isVisible) {
	adminLoginSection.classList.toggle("admin-hidden", isVisible);
	adminDashboardSection.classList.toggle("admin-hidden", !isVisible);
	adminRecordsSection.classList.toggle("admin-hidden", !isVisible);
	adminLogoutButton.classList.toggle("admin-hidden", !isVisible);
}

function renderStats(enrollments) {
	totalCount.textContent = String(enrollments.length);

	if (!enrollments.length) {
		topCourse.textContent = "-";
		latestEntry.textContent = "-";
		return;
	}

	const courseCount = {};
	enrollments.forEach((entry) => {
		courseCount[entry.course] = (courseCount[entry.course] || 0) + 1;
	});

	const sortedCourses = Object.entries(courseCount).sort((a, b) => b[1] - a[1]);
	topCourse.textContent = `${sortedCourses[0][0]} (${sortedCourses[0][1]})`;
	latestEntry.textContent = enrollments[0].name;
}

function renderTable(enrollments) {
	tableBody.innerHTML = "";

	if (!enrollments.length) {
		tableBody.innerHTML = '<tr><td colspan="5">No enrollments found.</td></tr>';
		return;
	}

	enrollments.forEach((entry) => {
		const row = document.createElement("tr");
		const createdAtMs = Date.parse(entry?.createdAt || "");
		const date = Number.isNaN(createdAtMs) ? "-" : new Date(createdAtMs).toLocaleString();
		row.innerHTML = `
			<td>${toSafeText(entry?.name)}</td>
			<td>${toSafeText(entry?.email)}</td>
			<td>${toSafeText(entry?.phone)}</td>
			<td>${toSafeText(entry?.course)}</td>
			<td>${toSafeText(date)}</td>
		`;
		tableBody.appendChild(row);
	});
}

function renderVisitorTrendChart(dailyVisitors = {}) {
	if (!visitorTrendChartCanvas || !window.Chart) return;

	const labels = Object.keys(dailyVisitors).sort();
	const values = labels.map((label) => Number(dailyVisitors[label] || 0));

	if (visitorChart) {
		visitorChart.destroy();
	}

	visitorChart = new window.Chart(visitorTrendChartCanvas, {
		type: "line",
		data: {
			labels,
			datasets: [
				{
					label: "Visitors per day",
					data: values,
					borderColor: "#2563eb",
					backgroundColor: "rgba(37,99,235,0.15)",
					fill: true,
					tension: 0.3,
					pointRadius: 3,
				},
			],
		},
		options: {
			responsive: true,
			plugins: { legend: { display: true } },
			scales: {
				y: {
					beginAtZero: true,
					ticks: { stepSize: 1 },
				},
			},
		},
	});
}

function applyQueryFilter() {
	const term = querySearchInput.value.trim().toLowerCase();
	if (!term) {
		renderTable(enrollmentCache);
		adminStatus.textContent = `Loaded ${enrollmentCache.length} record(s).`;
		return;
	}

	const filtered = enrollmentCache.filter((entry) => {
		const name = String(entry?.name || "").toLowerCase();
		const email = String(entry?.email || "").toLowerCase();
		const course = String(entry?.course || "").toLowerCase();
		const phone = String(entry?.phone || "").toLowerCase();
		return (
			name.includes(term)
			|| email.includes(term)
			|| course.includes(term)
			|| phone.includes(term)
		);
	});

	renderTable(filtered);
	adminStatus.textContent = `Showing ${filtered.length} of ${enrollmentCache.length} record(s).`;
}

function downloadCsv(data) {
	if (!data.length) {
		adminStatus.textContent = "No records available to export.";
		return;
	}

	const headers = ["Name", "Email", "Phone", "Course", "Created At"];
	const lines = data.map((entry) => [
		entry.name,
		entry.email,
		entry.phone,
		entry.course,
		new Date(entry.createdAt).toISOString(),
	]);

	const csvText = [headers, ...lines]
		.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
		.join("\n");

	const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = `ciit-enrollments-${Date.now()}.csv`;
	anchor.click();
	URL.revokeObjectURL(url);
}

async function loadOverview() {
	adminStatus.textContent = "Loading enrollment records...";
	await checkServerHealth();

	try {
		const response = await fetch(apiUrl("/api/admin/overview"), {
			headers: {
				"x-admin-pin": activeAdminPin,
			},
		});
		const payload = await response.json();

		if (!response.ok) {
			throw new Error(payload.message || "Failed to load data");
		}

		enrollmentCache = getSortedEnrollments(payload.enrollments || []);
		const currentCount = enrollmentCache.length;
		if (lastKnownEnrollmentCount > 0 && currentCount > lastKnownEnrollmentCount) {
			const newEntries = currentCount - lastKnownEnrollmentCount;
			showToast(`🎉 ${newEntries} new quer${newEntries > 1 ? "ies" : "y"} received!`, "success");
		}
		lastKnownEnrollmentCount = currentCount;

		totalVisitors.textContent = String(payload.totalVisitors || 0);
		renderStats(enrollmentCache);
		renderTable(enrollmentCache);
		renderVisitorTrendChart(payload.dailyVisitors || {});
		animateRefreshPulse();
		adminStatus.textContent = `Loaded ${enrollmentCache.length} record(s).`;
		querySearchInput.value = "";
		lastUpdatedText.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
	} catch (error) {
		adminStatus.textContent = error?.message || "Unable to reach backend. Start server and refresh.";
		if ((error?.message || "").toLowerCase().includes("unauthorized")) {
			setDashboardVisible(false);
			localStorage.removeItem(ADMIN_STORAGE_KEY);
			activeAdminPin = "";
			adminLoginStatus.textContent = "Session expired. Please enter PIN again.";
		}
	}
}

async function loginAdmin() {
	const pin = adminPinInput.value.trim();
	if (!/^\d{4}$/.test(pin)) {
		adminLoginStatus.textContent = "Enter valid 4-digit PIN.";
		adminLoginStatus.style.color = "#ef4444";
		return;
	}

	adminLoginStatus.textContent = "Verifying PIN...";
	adminLoginStatus.style.color = "#2563eb";

	try {
		const response = await fetch(apiUrl("/api/admin/login"), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ pin }),
		});
		const payload = await response.json();

		if (!response.ok) {
			adminLoginStatus.textContent = payload.message || "Invalid PIN";
			adminLoginStatus.style.color = "#ef4444";
			return;
		}

		activeAdminPin = pin;
		localStorage.setItem(ADMIN_STORAGE_KEY, pin);
		setDashboardVisible(true);
		adminLoginStatus.textContent = "";
		showToast("Admin login successful", "info");
		startAutoRefresh();
		loadOverview();
	} catch {
		adminLoginStatus.textContent = "Server unavailable. Please start backend.";
		adminLoginStatus.style.color = "#ef4444";
	}
}

function logoutAdmin() {
	if (autoRefreshTimer) {
		clearInterval(autoRefreshTimer);
		autoRefreshTimer = null;
	}

	activeAdminPin = "";
	localStorage.removeItem(ADMIN_STORAGE_KEY);
	enrollmentCache = [];
	tableBody.innerHTML = "";
	totalCount.textContent = "0";
	totalVisitors.textContent = "0";
	topCourse.textContent = "-";
	latestEntry.textContent = "-";
	if (visitorChart) {
		visitorChart.destroy();
		visitorChart = null;
	}
	querySearchInput.value = "";
	adminStatus.textContent = "";
	adminPinInput.value = "";
	adminLoginStatus.textContent = "Logged out successfully.";
	adminLoginStatus.style.color = "#16a34a";
	lastUpdatedText.textContent = "Last updated: --";
	lastKnownEnrollmentCount = 0;
	showToast("Logged out", "info");
	updateLiveUi(false);
	setDashboardVisible(false);
}

function updateLiveUi(isOnline) {
	if (isOnline) {
		serverLiveChip.classList.add("live-online");
		serverLiveChip.classList.remove("live-offline");
		serverLiveDot.classList.add("dot-online");
		serverLiveDot.classList.remove("dot-offline");
		serverLiveText.textContent = "Website Status: LIVE";
		return;
	}

	serverLiveChip.classList.add("live-offline");
	serverLiveChip.classList.remove("live-online");
	serverLiveDot.classList.add("dot-offline");
	serverLiveDot.classList.remove("dot-online");
	serverLiveText.textContent = "Website Status: OFFLINE";
}

async function checkServerHealth() {
	try {
		const response = await fetch(apiUrl("/api/health"));
		if (!response.ok) {
			updateLiveUi(false);
			return false;
		}
		updateLiveUi(true);
		return true;
	} catch {
		updateLiveUi(false);
		return false;
	}
}

function startAutoRefresh() {
	if (autoRefreshTimer) {
		clearInterval(autoRefreshTimer);
	}
	autoRefreshTimer = setInterval(() => {
		if (activeAdminPin) {
			loadOverview();
		}
	}, 20000);
}

exportCsvButton?.addEventListener("click", () => downloadCsv(enrollmentCache));
adminLoginButton?.addEventListener("click", loginAdmin);
adminLogoutButton?.addEventListener("click", logoutAdmin);
querySearchInput?.addEventListener("input", applyQueryFilter);
refreshNowBtn?.addEventListener("click", () => {
	if (activeAdminPin) {
		loadOverview();
	}
});
adminPinInput?.addEventListener("keydown", (event) => {
	if (event.key === "Enter") {
		loginAdmin();
	}
});

if (activeAdminPin) {
	setDashboardVisible(true);
	startAutoRefresh();
	loadOverview();
} else {
	setDashboardVisible(false);
	checkServerHealth();
}
