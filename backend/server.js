const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const mongoose = require("mongoose");
require("dotenv").config();

const jobs = require("./jobs");
const Resume = require("./Resume");

const app = express();

app.use(cors());
app.use(express.json());

// -----------------------------
// File Upload Configuration
// -----------------------------

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },

    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed"));
        }
    },
});

// -----------------------------
// Test API
// -----------------------------

app.get("/", (req, res) => {
    res.json({
        message: "AI Resume Job Matcher API is running!",
    });
});

// -----------------------------
// Resume Upload API
// -----------------------------

app.post(
    "/api/resume/upload",
    upload.single("resume"),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                message: "No resume uploaded",
            });
        }

        try {
            const parser = new PDFParse({
                data: req.file.buffer,
            });

            const result = await parser.getText();

            console.log(
                "EXTRACTED TEXT LENGTH:",
                result.text.length
            );

            await parser.destroy();

            res.json({
                message: "Resume text extracted successfully",
                filename: req.file.originalname,
                text: result.text,
            });
        } catch (error) {
            console.error(
                "PDF extraction error:",
                error.message
            );

            res.status(500).json({
                message: "Failed to extract resume text",
                error: error.message,
            });
        }
    }
);

// -----------------------------
// AI Resume Analysis API
// -----------------------------

app.post("/api/resume/analyze", async (req, res) => {
    const { text, filename } = req.body;

    if (!text) {
        return res.status(400).json({
            message: "Resume text is required",
        });
    }

    try {
        // Send resume text to Ollama
        const response = await fetch(
            "http://localhost:11434/api/generate",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    model: "llama3.2:3b",

                    prompt: `Analyze the following resume and return ONLY valid JSON.

Required fields:
- skills: array of skills
- education: string
- experience: string
- projects: array of projects
- strengths: array of strengths
- missingSkills: array of useful missing skills
- resumeScore: number from 0 to 100

Resume:
${text}

Return JSON only.`,

                    stream: false,
                    format: "json",
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Ollama request failed"
            );
        }

        // Convert AI response into JavaScript object
        const analysis = JSON.parse(data.response);

        // -----------------------------
        // Convert Projects to Strings
        // -----------------------------

        const projects = (
            analysis.projects || []
        ).map((project) => {
            if (typeof project === "string") {
                return project;
            }

            return (
                project.name ||
                project.title ||
                JSON.stringify(project)
            );
        });

        // -----------------------------
        // Save Resume to MongoDB
        // -----------------------------

        console.log(
            "Saving resume to MongoDB..."
        );

        const savedResume = await Resume.create({
            filename: filename || "resume.pdf",

            skills: analysis.skills || [],

            education:
                analysis.education || "",

            experience:
                analysis.experience || "",

            projects: projects,

            strengths:
                analysis.strengths || [],

            missingSkills:
                analysis.missingSkills || [],

            resumeScore:
                analysis.resumeScore || 0,
        });

        console.log(
            "Resume saved to MongoDB:",
            savedResume._id
        );

        // -----------------------------
        // Send Response to Frontend
        // -----------------------------

        res.json({
            message: "Resume analyzed successfully",

            analysis: analysis,

            resumeId: savedResume._id,
        });
    } catch (error) {
        console.error(
            "AI analysis error:",
            error.message
        );

        console.error(error);

        res.status(500).json({
            message: "Failed to analyze resume",
            error: error.message,
        });
    }
});

// -----------------------------
// Job Matching API
// -----------------------------

app.post("/api/jobs/match", (req, res) => {
    const { skills } = req.body;

    if (!skills || !Array.isArray(skills)) {
        return res.status(400).json({
            message: "Skills are required",
        });
    }

    // Skill aliases
    const skillAliases = {
        js: "javascript",
        reactjs: "react",
        node: "node.js",
        nodejs: "node.js",
        ml: "machine learning",
        dl: "deep learning",
        dsa: "dsa",
    };

    // Normalize skill names
    const normalizeSkill = (skill) => {
        const normalized = skill
            .toLowerCase()
            .trim();

        return (
            skillAliases[normalized] ||
            normalized
        );
    };

    const userSkills =
        skills.map(normalizeSkill);

    // Match jobs
    const matchedJobs = jobs.map((job) => {
        const matchedSkills =
            job.skills.filter((jobSkill) => {
                const normalizedJobSkill =
                    normalizeSkill(jobSkill);

                return userSkills.includes(
                    normalizedJobSkill
                );
            });

        const matchPercentage = Math.round(
            (matchedSkills.length /
                job.skills.length) *
                100
        );

        return {
            ...job,
            matchedSkills,
            matchPercentage,
        };
    });

    // Highest match first
    matchedJobs.sort(
        (a, b) =>
            b.matchPercentage -
            a.matchPercentage
    );

    res.json({
        message: "Jobs matched successfully",
        jobs: matchedJobs,
    });
});

// -----------------------------
// MongoDB Connection
// -----------------------------

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log(
            "MongoDB connected successfully!"
        );
    })
    .catch((error) => {
        console.error(
            "MongoDB connection error:",
            error.message
        );
    });

// -----------------------------
// Start Server
// -----------------------------

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});