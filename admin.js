const themeToggle = document.getElementById("themeToggle");
const body = document.body;

const QUERY_SEEN_TS_KEY = "ciit-query-seen-ts";
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
const contentManagerSection = document.getElementById("contentManagerSection");
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
const queryCourseFilter = document.getElementById("queryCourseFilter");
const queryDateFilter = document.getElementById("queryDateFilter");
const visitorTrendChartCanvas = document.getElementById("visitorTrendChart");
const refreshNowBtn = document.getElementById("refreshNowBtn");
const markSeenBtn = document.getElementById("markSeenBtn");
const serverLiveChip = document.getElementById("serverLiveChip");
const serverLiveDot = document.getElementById("serverLiveDot");
const serverLiveText = document.getElementById("serverLiveText");
const lastUpdatedText = document.getElementById("lastUpdatedText");
const adminToast = document.getElementById("adminToast");
const newQueryCount = document.getElementById("newQueryCount");
const contentStatus = document.getElementById("contentStatus");
const reloadContentBtn = document.getElementById("reloadContentBtn");
const saveContentBtn = document.getElementById("saveContentBtn");
const admissionTextInput = document.getElementById("admissionTextInput");
const heroBadgeInput = document.getElementById("heroBadgeInput");
const heroTitleInput = document.getElementById("heroTitleInput");
const heroSubtitleInput = document.getElementById("heroSubtitleInput");
const highlightsInput = document.getElementById("highlightsInput");
const futureDirectionsInput = document.getElementById("futureDirectionsInput");
const officersInput = document.getElementById("officersInput");
const festivalsInput = document.getElementById("festivalsInput");
const coursesInput = document.getElementById("coursesInput");
const placementsInput = document.getElementById("placementsInput");

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
let activeAdminPin = "";
let autoRefreshTimer = null;
let lastKnownEnrollmentCount = 0;
let lastSeenTimestamp = Number(localStorage.getItem(QUERY_SEEN_TS_KEY) || "0") || 0;

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
	contentManagerSection.classList.add("admin-hidden");
	adminLogoutButton.classList.toggle("admin-hidden", !isVisible);
}

function splitLines(value) {
	return String(value || "")
		.split("\n")
		.map((item) => item.trim())
		.filter(Boolean);
}

function parseCourses(value) {
	const lines = splitLines(value);
	const parsed = lines.map((line) => {
		const [nameRaw, durationRaw, modulesRaw] = line.split("|").map((item) => item.trim());
		if (!nameRaw) return null;
		const modules = String(modulesRaw || "")
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean);
		return {
			name: nameRaw,
			duration: durationRaw || "",
			modules,
		};
	});

	return parsed.filter(Boolean);
}

function parseOfficers(value) {
	const lines = splitLines(value);
	return lines
		.map((line) => {
			const [nameRaw, roleRaw] = line.split("|").map((item) => item.trim());
			if (!nameRaw) return null;
			return { name: nameRaw, role: roleRaw || "" };
		})
		.filter(Boolean);
}

function parsePlacements(value) {
	const lines = splitLines(value);
	return lines
		.map((line) => {
			const [nameRaw, companyRaw, technologyRaw, packageRaw] = line.split("|").map((item) => item.trim());
			if (!nameRaw || !companyRaw || !technologyRaw || !packageRaw) return null;
			return {
				name: nameRaw,
				company: companyRaw,
				technology: technologyRaw,
				package: packageRaw,
			};
		})
		.filter(Boolean);
}

function fillContentForm(content) {
	admissionTextInput.value = content.admissionText || "";
	heroBadgeInput.value = content.hero?.badge || "";
	heroTitleInput.value = content.hero?.title || "";
	heroSubtitleInput.value = content.hero?.subtitle || "";
	highlightsInput.value = (content.highlights || []).join("\n");
	futureDirectionsInput.value = (content.futureDirections || []).join("\n");
	officersInput.value = (content.officers || [])
		.map((item) => `${item.name || ""} | ${item.role || ""}`.trim())
		.join("\n");
	festivalsInput.value = (content.festivals || []).join("\n");
	coursesInput.value = (content.courses || [])
		.map((item) => `${item.name || ""} | ${item.duration || ""} | ${(item.modules || []).join(", ")}`)
		.join("\n");
	placementsInput.value = (content.placements || [])
		.map((item) => `${item.name || ""} | ${item.company || ""} | ${item.technology || ""} | ${item.package || ""}`)
		.join("\n");
}

async function loadContentEditor() {
	if (!activeAdminPin) return;
	contentStatus.textContent = "Loading website content...";

	try {
		const response = await fetch(apiUrl("/api/admin/content"), {
			headers: {
				"x-admin-pin": activeAdminPin,
			},
		});
		const payload = await response.json();
		if (!response.ok) {
			throw new Error(payload.message || "Unable to load website content");
		}

		fillContentForm(payload.content || {});
		contentStatus.textContent = "Content loaded. Edit and click Save Website Content.";
	} catch (error) {
		contentStatus.textContent = error?.message || "Could not load content editor.";
	}
}

async function saveContentEditor() {
	if (!activeAdminPin) return;

	const courses = parseCourses(coursesInput.value);
	if (!courses.length) {
		contentStatus.textContent = "At least 1 course is required.";
		return;
	}

	const placements = parsePlacements(placementsInput.value);
	if (!placements.length) {
		contentStatus.textContent = "At least 1 placement row is required (Name | Company | Technology | Package).";
		return;
	}

	const payload = {
		admissionText: admissionTextInput.value.trim(),
		hero: {
			badge: heroBadgeInput.value.trim(),
			title: heroTitleInput.value.trim(),
			subtitle: heroSubtitleInput.value.trim(),
		},
		highlights: splitLines(highlightsInput.value),
		futureDirections: splitLines(futureDirectionsInput.value),
		officers: parseOfficers(officersInput.value),
		festivals: splitLines(festivalsInput.value),
		courses,
		placements,
	};

	contentStatus.textContent = "Saving website content...";

	try {
		const response = await fetch(apiUrl("/api/admin/content"), {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"x-admin-pin": activeAdminPin,
			},
			body: JSON.stringify(payload),
		});

		const result = await response.json();
		if (!response.ok) {
			throw new Error(result.message || "Content save failed");
		}

		contentStatus.textContent = "Website content saved successfully. Refresh homepage to see updates.";
		showToast("Website content updated", "success");
		fillContentForm(result.content || payload);
	} catch (error) {
		contentStatus.textContent = error?.message || "Could not save website content.";
		showToast("Failed to save content", "error");
	}
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

function isWithinDateRange(createdAt, range) {
	if (!createdAt || range === "all") return true;
	const createdMs = Date.parse(createdAt);
	if (Number.isNaN(createdMs)) return false;

	const now = Date.now();
	if (range === "today") {
		const start = new Date();
		start.setHours(0, 0, 0, 0);
		return createdMs >= start.getTime();
	}
	if (range === "7d") {
		return createdMs >= now - (7 * 24 * 60 * 60 * 1000);
	}
	if (range === "30d") {
		return createdMs >= now - (30 * 24 * 60 * 60 * 1000);
	}
	return true;
}

function updateUnreadCount() {
	const unreadCount = enrollmentCache.filter((entry) => {
		const createdMs = Date.parse(entry?.createdAt || "");
		return !Number.isNaN(createdMs) && createdMs > lastSeenTimestamp;
	}).length;

	newQueryCount.textContent = String(unreadCount);
}

function populateCourseFilter(enrollments) {
	const selected = queryCourseFilter.value || "all";
	const uniqueCourses = [...new Set(enrollments.map((entry) => String(entry?.course || "").trim()).filter(Boolean))].sort();
	queryCourseFilter.innerHTML = '<option value="all">All Courses</option>';

	uniqueCourses.forEach((course) => {
		const option = document.createElement("option");
		option.value = course;
		option.textContent = course;
		queryCourseFilter.appendChild(option);
	});

	if (["all", ...uniqueCourses].includes(selected)) {
		queryCourseFilter.value = selected;
	}
}

function renderTable(enrollments) {
	tableBody.innerHTML = "";

	if (!enrollments.length) {
		tableBody.innerHTML = '<tr><td colspan="6">No enrollments found.</td></tr>';
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
			<td><button class="btn btn-mini btn-danger delete-query-btn" type="button" data-id="${toSafeText(entry?.id)}">Delete</button></td>
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
	const selectedCourse = queryCourseFilter.value;
	const selectedDateRange = queryDateFilter.value;

	const filtered = enrollmentCache.filter((entry) => {
		const name = String(entry?.name || "").toLowerCase();
		const email = String(entry?.email || "").toLowerCase();
		const course = String(entry?.course || "").toLowerCase();
		const phone = String(entry?.phone || "").toLowerCase();
		const matchesTerm = !term || (
			name.includes(term)
			|| email.includes(term)
			|| course.includes(term)
			|| phone.includes(term)
		);
		const matchesCourse = selectedCourse === "all" || String(entry?.course || "") === selectedCourse;
		const matchesDate = isWithinDateRange(entry?.createdAt, selectedDateRange);
		return (
			matchesTerm
			&& matchesCourse
			&& matchesDate
		);
	});

	renderTable(filtered);
	adminStatus.textContent = `Showing ${filtered.length} of ${enrollmentCache.length} record(s).`;
}

async function deleteEnrollment(entryId) {
	if (!activeAdminPin || !entryId) return;
	const shouldDelete = window.confirm("Delete this query? This action cannot be undone.");
	if (!shouldDelete) return;

	try {
		const response = await fetch(apiUrl(`/api/admin/enrollments/${encodeURIComponent(entryId)}`), {
			method: "DELETE",
			headers: {
				"x-admin-pin": activeAdminPin,
			},
		});
		const payload = await response.json();
		if (!response.ok) {
			throw new Error(payload.message || "Delete failed");
		}

		showToast("Query deleted", "success");
		await loadOverview();
	} catch (error) {
		showToast(error?.message || "Could not delete query", "error");
	}
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
		populateCourseFilter(enrollmentCache);
		updateUnreadCount();
		renderStats(enrollmentCache);
		applyQueryFilter();
		renderVisitorTrendChart(payload.dailyVisitors || {});
		animateRefreshPulse();
		adminStatus.textContent = `Loaded ${enrollmentCache.length} record(s).`;
		querySearchInput.value = "";
		lastUpdatedText.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
	} catch (error) {
		adminStatus.textContent = error?.message || "Unable to reach backend. Start server and refresh.";
		if ((error?.message || "").toLowerCase().includes("unauthorized")) {
			setDashboardVisible(false);
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
		adminPinInput.value = "";
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
	enrollmentCache = [];
	tableBody.innerHTML = "";
	totalCount.textContent = "0";
	totalVisitors.textContent = "0";
	topCourse.textContent = "-";
	latestEntry.textContent = "-";
	newQueryCount.textContent = "0";
	queryCourseFilter.value = "all";
	queryDateFilter.value = "all";
	if (visitorChart) {
		visitorChart.destroy();
		visitorChart = null;
	}
	querySearchInput.value = "";
	adminStatus.textContent = "";
	contentStatus.textContent = "";
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
queryCourseFilter?.addEventListener("change", applyQueryFilter);
queryDateFilter?.addEventListener("change", applyQueryFilter);
markSeenBtn?.addEventListener("click", () => {
	lastSeenTimestamp = Date.now();
	localStorage.setItem(QUERY_SEEN_TS_KEY, String(lastSeenTimestamp));
	updateUnreadCount();
	showToast("All queries marked as seen", "info");
});
refreshNowBtn?.addEventListener("click", () => {
	if (activeAdminPin) {
		loadOverview();
	}
});
tableBody?.addEventListener("click", (event) => {
	const target = event.target;
	if (!(target instanceof HTMLElement)) return;
	if (!target.classList.contains("delete-query-btn")) return;
	const entryId = target.dataset.id;
	deleteEnrollment(entryId);
});
adminPinInput?.addEventListener("keydown", (event) => {
	if (event.key === "Enter") {
		loginAdmin();
	}
});

setDashboardVisible(false);
checkServerHealth();
