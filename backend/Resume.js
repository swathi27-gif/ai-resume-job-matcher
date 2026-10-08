const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
    {
        filename: {
            type: String,
            required: true,
        },

        skills: {
            type: [String],
            default: [],
        },

        education: {
            type: String,
            default: "",
        },

        experience: {
            type: String,
            default: "",
        },

        projects: {
            type: [String],
            default: [],
        },

        strengths: {
            type: [String],
            default: [],
        },

        missingSkills: {
            type: [String],
            default: [],
        },

        resumeScore: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Resume", resumeSchema);