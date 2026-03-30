const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ADMIN_PIN = process.env.ADMIN_PIN || "7823";
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 5 * 60 * 1000;

const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

const allowedOrigins = new Set([
	"http://localhost:3000",
	"http://127.0.0.1:3000",
	"http://localhost:5500",
	"http://127.0.0.1:5500",
	"https://shravannikalje.github.io",
	...configuredOrigins,
]);

function isAllowedOrigin(origin) {
	if (!origin) return true;
	if (allowedOrigins.has(origin)) return true;
	if (/^https:\/\/[a-z0-9-]+\.github\.io$/i.test(origin)) return true;
	if (/^http:\/\/localhost:\d+$/i.test(origin)) return true;
	if (/^http:\/\/127\.0\.0\.1:\d+$/i.test(origin)) return true;
	return false;
}

const dataFile = path.join(__dirname, "data", "enrollments.json");
const metricsFile = path.join(__dirname, "data", "metrics.json");
const siteContentFile = path.join(__dirname, "data", "site-content.json");
const loginAttempts = new Map();

const defaultSiteContent = {
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
		{ name: ".NET Full Stack", duration: "6 Months • Beginner to Advanced", modules: ["C# Fundamentals", "ASP.NET Core Web API", "Entity Framework + SQL Server", "Angular/React Frontend", "Authentication + Deployment"] },
		{ name: "Java Full Stack", duration: "6 Months • Industry Track", modules: ["Core Java + OOP", "Spring Boot + REST API", "Hibernate + MySQL", "React Frontend", "Microservices Basics"] },
		{ name: "Python Full Stack", duration: "6 Months • Project Based", modules: ["Python Core + Advanced", "Django/Flask", "Database Integration", "Frontend Essentials", "Testing + Deployment"] },
		{ name: "MEAN Stack", duration: "5 Months • Web App Focus", modules: ["MongoDB", "Express.js API", "Angular UI", "Node.js Backend", "JWT + CI/CD"] },
		{ name: "MERN Stack", duration: "5 Months • Startup Stack", modules: ["MongoDB", "Express.js", "React.js", "Node.js", "State Management + Deployment"] },
		{ name: "Software Testing", duration: "4 Months • Manual + Automation", modules: ["STLC & Bug Lifecycle", "Test Case Design", "Selenium WebDriver", "API Testing (Postman)", "Performance & QA Reports"] },
		{ name: "Data Science & Analytics", duration: "6 Months • Data Career Path", modules: ["Python for Data", "Pandas + NumPy", "Visualization", "Machine Learning Basics", "Capstone Analytics Project"] },
		{ name: "Digital Marketing", duration: "3 Months • Practical Campaigns", modules: ["SEO + SEM", "Social Media Marketing", "Google Ads", "Content Strategy", "Analytics & Reporting"] },
		{ name: "Cloud Computing", duration: "4 Months • Azure/AWS Basics", modules: ["Cloud Fundamentals", "Virtual Machines", "Storage + Networking", "DevOps Intro", "Cloud Deployment"] },
		{ name: "ReactJS", duration: "3 Months • Frontend Specialization", modules: ["JSX + Components", "Hooks", "Routing", "State Management", "API Integration"] },
		{ name: "Angular", duration: "3 Months • Frontend Framework", modules: ["TypeScript Basics", "Components + Services", "Routing", "Forms + Validation", "Build + Deploy"] },
		{ name: "DBA", duration: "3 Months • Database Admin", modules: ["SQL Administration", "Backup & Recovery", "Performance Tuning", "Security & Roles", "Monitoring"] },
		{ name: "RDBMS", duration: "2.5 Months • SQL Foundation", modules: ["Normalization", "SQL Queries", "Joins + Views", "Indexes", "Stored Procedures"] },
		{ name: "C++ Programming", duration: "2 Months • Strong Fundamentals", modules: ["Syntax + Logic", "OOP in C++", "STL", "File Handling", "Mini Projects"] },
		{ name: "Real Time Project", duration: "1.5 Months • Hands-On", modules: ["Requirement Analysis", "Design + Planning", "Coding Sprint", "Testing + Review", "Final Demo + Interview Prep"] },
	],
	futureDirections: [
		"Industry 4.0 & Innovation Centers",
		"Global Skill Development",
		"Placement Expansion",
		"Future‑Ready Vision",
	],
	officers: [
		{ name: "Shravan Nikalje", role: "Student Coordinator" },
	],
	festivals: [
		"Tech Fest 2026",
		"Hackathon Week",
	],
	placements: [
		{ name: "Rupesh Dhabarde", company: "Perpetituut Technosoft", technology: "Dot Net", package: "6.2 LPA" },
		{ name: "Akshay Pawar", company: "Rabbit & Tortoise", technology: "Dot Net", package: "3.5 LPA" },
		{ name: "Pratiksha Phadatare", company: "Rabbit & Tortoise", technology: "Dot Net", package: "3.5 LPA" },
		{ name: "Akash Supelkar", company: "Avenitrinnovative", technology: "Dot Net", package: "3.5 LPA" },
		{ name: "Nilesh More", company: "Height Technologies", technology: "Dot Net", package: "4.5 LPA" },
		{ name: "Datta Shinde", company: "Optical ARC", technology: "Front End Developer", package: "2.18 LPA" },
		{ name: "Sariket Bhujbal", company: "Infosys", technology: "Dot Net", package: "4.3 LPA" },
		{ name: "Snehal", company: "Snow White", technology: "MEAN Stack", package: "4.5 LPA" },
		{ name: "Yogita Ghorad", company: "Agilad Technologies Pvt Ltd", technology: "Dot Net", package: "2.5 LPA" },
		{ name: "Akash Bhujbal", company: "Assentex", technology: "Dot Net", package: "3.5 LPA" },
	],
	updatedAt: new Date().toISOString(),
};

function toNonEmptyString(value, fallback = "") {
	const result = String(value || "").trim();
	return result || fallback;
}

function normalizeSiteContent(content) {
	const source = typeof content === "object" && content ? content : {};
	const heroSource = typeof source.hero === "object" && source.hero ? source.hero : {};

	const normalizedCourses = Array.isArray(source.courses)
		? source.courses
			.map((course) => {
				if (typeof course === "string") {
					const name = toNonEmptyString(course);
					if (!name) return null;
					return { name, duration: "", modules: [] };
				}

				if (!course || typeof course !== "object") return null;
				const name = toNonEmptyString(course.name);
				if (!name) return null;
				const duration = toNonEmptyString(course.duration);
				const modules = Array.isArray(course.modules)
					? course.modules.map((module) => toNonEmptyString(module)).filter(Boolean)
					: [];

				return { name, duration, modules };
			})
			.filter(Boolean)
		: [];

	const normalizedPlacements = Array.isArray(source.placements)
		? source.placements
			.map((placement) => {
				if (!placement || typeof placement !== "object") return null;
				const name = toNonEmptyString(placement.name);
				const company = toNonEmptyString(placement.company);
				const technology = toNonEmptyString(placement.technology);
				const pkg = toNonEmptyString(placement.package);
				if (!name || !company || !technology || !pkg) return null;
				return { name, company, technology, package: pkg };
			})
			.filter(Boolean)
		: [];

	const normalizedOfficers = Array.isArray(source.officers)
		? source.officers
			.map((officer) => {
				if (typeof officer === "string") {
					const name = toNonEmptyString(officer);
					if (!name) return null;
					return { name, role: "" };
				}
				if (!officer || typeof officer !== "object") return null;
				const name = toNonEmptyString(officer.name);
				if (!name) return null;
				return { name, role: toNonEmptyString(officer.role) };
			})
			.filter(Boolean)
		: [];

	return {
		admissionText: toNonEmptyString(source.admissionText, defaultSiteContent.admissionText),
		hero: {
			badge: toNonEmptyString(heroSource.badge, defaultSiteContent.hero.badge),
			title: toNonEmptyString(heroSource.title, defaultSiteContent.hero.title),
			subtitle: toNonEmptyString(heroSource.subtitle, defaultSiteContent.hero.subtitle),
		},
		highlights: Array.isArray(source.highlights)
			? source.highlights.map((item) => toNonEmptyString(item)).filter(Boolean)
			: [...defaultSiteContent.highlights],
		courses: normalizedCourses.length ? normalizedCourses : [...defaultSiteContent.courses],
		futureDirections: Array.isArray(source.futureDirections)
			? source.futureDirections.map((item) => toNonEmptyString(item)).filter(Boolean)
			: [...defaultSiteContent.futureDirections],
		officers: normalizedOfficers,
		festivals: Array.isArray(source.festivals)
			? source.festivals.map((item) => toNonEmptyString(item)).filter(Boolean)
			: [...defaultSiteContent.festivals],
		placements: normalizedPlacements.length ? normalizedPlacements : [...defaultSiteContent.placements],
		updatedAt: toNonEmptyString(source.updatedAt, new Date().toISOString()),
	};
}

function readEnrollments() {
	try {
		const raw = fs.readFileSync(dataFile, "utf-8");
		return JSON.parse(raw);
	} catch {
		return [];
	}
}

function writeEnrollments(enrollments) {
	fs.writeFileSync(dataFile, JSON.stringify(enrollments, null, 2), "utf-8");
}

function sortEnrollmentsNewestFirst(enrollments) {
	return [...(enrollments || [])].sort((a, b) => {
		const timeA = Date.parse(a?.createdAt || "") || 0;
		const timeB = Date.parse(b?.createdAt || "") || 0;
		return timeB - timeA;
	});
}

function readMetrics() {
	try {
		const raw = fs.readFileSync(metricsFile, "utf-8");
		const parsed = JSON.parse(raw);
		const totalVisitors = typeof parsed.totalVisitors === "number" ? parsed.totalVisitors : 0;
		const dailyVisitors = typeof parsed.dailyVisitors === "object" && parsed.dailyVisitors !== null ? parsed.dailyVisitors : {};
		return { totalVisitors, dailyVisitors };
	} catch {
		return { totalVisitors: 0, dailyVisitors: {} };
	}
}

function writeMetrics(metrics) {
	fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2), "utf-8");
}

function ensureSiteContentFile() {
	if (!fs.existsSync(siteContentFile)) {
		const normalizedDefault = normalizeSiteContent(defaultSiteContent);
		fs.writeFileSync(siteContentFile, JSON.stringify(normalizedDefault, null, 2), "utf-8");
	}
}

function readSiteContent() {
	ensureSiteContentFile();
	try {
		const raw = fs.readFileSync(siteContentFile, "utf-8");
		const parsed = JSON.parse(raw);
		return normalizeSiteContent(parsed);
	} catch {
		return normalizeSiteContent(defaultSiteContent);
	}
}

function writeSiteContent(content) {
	const normalized = normalizeSiteContent({
		...content,
		updatedAt: new Date().toISOString(),
	});
	fs.writeFileSync(siteContentFile, JSON.stringify(normalized, null, 2), "utf-8");
	return normalized;
}

function isAdminAuthorized(req) {
	const pinFromHeader = req.headers["x-admin-pin"];
	return String(pinFromHeader || "") === ADMIN_PIN;
}

function getClientIp(req) {
	const xff = req.headers["x-forwarded-for"];
	if (xff && typeof xff === "string") {
		return xff.split(",")[0].trim();
	}
	return req.ip || req.socket?.remoteAddress || "unknown";
}

function getTodayKey() {
	return new Date().toISOString().slice(0, 10);
}

app.use(express.json());
app.use(cors({
	origin(origin, callback) {
		if (isAllowedOrigin(origin)) {
			callback(null, true);
			return;
		}
		callback(new Error("CORS blocked for this origin"));
	},
}));

app.get(["/", "/index.html"], (req, res, next) => {
	const metrics = readMetrics();
	metrics.totalVisitors += 1;
	const today = getTodayKey();
	metrics.dailyVisitors[today] = (metrics.dailyVisitors[today] || 0) + 1;
	writeMetrics(metrics);
	next();
});

app.use(express.static(__dirname));

app.get("/api/health", (_req, res) => {
	res.json({
		status: "ok",
		service: "ciit-api",
		uptimeSeconds: Math.floor(process.uptime()),
		serverTime: new Date().toISOString(),
	});
});

app.get("/api/courses", (_req, res) => {
	const siteContent = readSiteContent();
	res.json({ courses: siteContent.courses.map((course) => course.name) });
});

app.get("/api/placements", (_req, res) => {
	const siteContent = readSiteContent();
	res.json({ placements: siteContent.placements });
});

app.get("/api/site-content", (_req, res) => {
	res.json({ content: readSiteContent() });
});

app.get("/api/enrollments", (_req, res) => {
	res.json({ enrollments: readEnrollments() });
});

app.post("/api/admin/login", (req, res) => {
	const clientIp = getClientIp(req);
	const record = loginAttempts.get(clientIp) || { count: 0, lockedUntil: 0 };
	const { pin } = req.body || {};

	if (String(pin || "") === ADMIN_PIN) {
		loginAttempts.delete(clientIp);
		return res.json({ message: "Login successful" });
	}

	if (record.lockedUntil > Date.now()) {
		const retryAfterSeconds = Math.ceil((record.lockedUntil - Date.now()) / 1000);
		return res.status(429).json({
			message: `Too many attempts. Try again in ${retryAfterSeconds} seconds.`,
			retryAfterSeconds,
		});
	}

	record.count += 1;
	if (record.count >= MAX_LOGIN_ATTEMPTS) {
		record.lockedUntil = Date.now() + LOGIN_LOCK_MS;
		record.count = 0;
		loginAttempts.set(clientIp, record);
		return res.status(429).json({ message: "Too many attempts. Login locked for 5 minutes." });
	}

	loginAttempts.set(clientIp, record);
	const remainingAttempts = MAX_LOGIN_ATTEMPTS - record.count;
	return res.status(401).json({ message: `Invalid admin PIN. ${remainingAttempts} attempt(s) left.` });
});

app.get("/api/admin/overview", (req, res) => {
	if (!isAdminAuthorized(req)) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const enrollments = sortEnrollmentsNewestFirst(readEnrollments());
	const metrics = readMetrics();

	return res.json({
		totalVisitors: metrics.totalVisitors,
		dailyVisitors: metrics.dailyVisitors,
		totalEnrollments: enrollments.length,
		enrollments,
	});
});

app.delete("/api/admin/enrollments/:id", (req, res) => {
	if (!isAdminAuthorized(req)) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const enrollmentId = String(req.params.id || "").trim();
	if (!enrollmentId) {
		return res.status(400).json({ message: "Enrollment id is required" });
	}

	const enrollments = readEnrollments();
	const next = enrollments.filter((entry) => String(entry?.id || "") !== enrollmentId);

	if (next.length === enrollments.length) {
		return res.status(404).json({ message: "Enrollment not found" });
	}

	writeEnrollments(next);
	return res.json({ message: "Enrollment deleted successfully" });
});

app.get("/api/admin/content", (req, res) => {
	if (!isAdminAuthorized(req)) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	return res.json({ content: readSiteContent() });
});

app.put("/api/admin/content", (req, res) => {
	if (!isAdminAuthorized(req)) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const payload = req.body || {};
	const normalized = writeSiteContent(payload);
	return res.json({ message: "Website content updated successfully", content: normalized });
});

app.post("/api/enrollments", (req, res) => {
	const { name, email, phone, course } = req.body || {};
	const availableCourses = readSiteContent().courses.map((item) => item.name);

	if (!name || String(name).trim().length < 3) {
		return res.status(400).json({ message: "Invalid name" });
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""))) {
		return res.status(400).json({ message: "Invalid email" });
	}
	if (!/^\d{10}$/.test(String(phone || ""))) {
		return res.status(400).json({ message: "Phone must be 10 digits" });
	}
	if (!availableCourses.includes(course)) {
		return res.status(400).json({ message: "Invalid course" });
	}

	const enrollments = readEnrollments();
	const record = {
		id: Date.now().toString(),
		name: String(name).trim(),
		email: String(email).trim(),
		phone: String(phone).trim(),
		course,
		createdAt: new Date().toISOString(),
	};

	enrollments.unshift(record);
	writeEnrollments(enrollments);

	return res.status(201).json({ message: "Enrollment submitted successfully", enrollment: record });
});

app.listen(PORT, () => {
	console.log(`CIIT server running on http://localhost:${PORT}`);
});
