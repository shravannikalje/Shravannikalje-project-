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
const loginAttempts = new Map();

const courses = [
	".NET Full Stack",
	"Java Full Stack",
	"Python Full Stack",
	"MEAN Stack",
	"MERN Stack",
	"Software Testing",
	"Data Science & Analytics",
	"Digital Marketing",
	"Cloud Computing",
	"ReactJS",
	"Angular",
	"DBA",
	"RDBMS",
	"C++ Programming",
	"Real Time Project",
];

const placements = [
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
];

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
	res.json({ courses });
});

app.get("/api/placements", (_req, res) => {
	res.json({ placements });
});

app.get("/api/enrollments", (_req, res) => {
	res.json({ enrollments: readEnrollments() });
});

app.post("/api/admin/login", (req, res) => {
	const clientIp = getClientIp(req);
	const record = loginAttempts.get(clientIp) || { count: 0, lockedUntil: 0 };

	if (record.lockedUntil > Date.now()) {
		const retryAfterSeconds = Math.ceil((record.lockedUntil - Date.now()) / 1000);
		return res.status(429).json({
			message: `Too many attempts. Try again in ${retryAfterSeconds} seconds.`,
			retryAfterSeconds,
		});
	}

	const { pin } = req.body || {};
	if (String(pin || "") !== ADMIN_PIN) {
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
	}

	loginAttempts.delete(clientIp);

	return res.json({ message: "Login successful" });
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

app.post("/api/enrollments", (req, res) => {
	const { name, email, phone, course } = req.body || {};

	if (!name || String(name).trim().length < 3) {
		return res.status(400).json({ message: "Invalid name" });
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""))) {
		return res.status(400).json({ message: "Invalid email" });
	}
	if (!/^\d{10}$/.test(String(phone || ""))) {
		return res.status(400).json({ message: "Phone must be 10 digits" });
	}
	if (!courses.includes(course)) {
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
