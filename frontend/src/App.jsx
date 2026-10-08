import { useState } from "react";
import "./App.css";

function App() {
  const [resume, setResume] = useState(null);
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const handleFileChange = (event) => {
    setResume(event.target.files[0]);
    setMessage("");
    setAnalysis(null);
    setMatchedJobs([]);
    setSearchTerm("");
  };

  const handleUpload = async () => {
    if (!resume) {
      setMessage("Please select a PDF resume first.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resume);

    setMessage("Uploading and extracting resume...");
    setAnalysis(null);
    setMatchedJobs([]);
    setSearchTerm("");

    try {
      // Step 1: Upload PDF and extract text
      const uploadResponse = await fetch(
        "http://localhost:5000/api/resume/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(
          uploadData.message || "Resume upload failed"
        );
      }

      // Step 2: Analyze resume using Ollama
      setMessage("Resume extracted. Analyzing with AI...");

      const analyzeResponse = await fetch(
        "http://localhost:5000/api/resume/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: uploadData.text,
            filename: uploadData.filename,
          }),
        }
      );

      const analyzeData = await analyzeResponse.json();

      if (!analyzeResponse.ok) {
        throw new Error(
          analyzeData.message || "AI analysis failed"
        );
      }

      setAnalysis(analyzeData.analysis);

      // Step 3: Match resume skills with jobs
      setMessage(
        "AI analysis complete. Finding matching jobs..."
      );

      const matchResponse = await fetch(
        "http://localhost:5000/api/jobs/match",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            skills: analyzeData.analysis.skills,
          }),
        }
      );

      const matchData = await matchResponse.json();

      if (!matchResponse.ok) {
        throw new Error(
          matchData.message || "Job matching failed"
        );
      }

      setMatchedJobs(matchData.jobs);

      setMessage(
        "✅ Resume analyzed and jobs matched successfully!"
      );
    } catch (error) {
      console.error(error);

      setMessage(`❌ ${error.message}`);
    }
  };

  // Filter jobs based on search
  const filteredJobs = matchedJobs.filter((job) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) {
      return true;
    }

    return (
      job.title.toLowerCase().includes(search) ||
      job.company.toLowerCase().includes(search) ||
      job.skills.some((skill) =>
        skill.toLowerCase().includes(search)
      )
    );
  });

  return (
    <div className="app">
      <h1>AI Resume Analyzer</h1>

      <p>
        Upload your resume and discover matching jobs.
      </p>

      <div className="upload-box">
        <h2>Upload Your Resume</h2>

        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
        />

        {resume && (
          <p>
            Selected: <strong>{resume.name}</strong>
          </p>
        )}

        <button
          onClick={handleUpload}
          disabled={!resume}
        >
          Analyze Resume
        </button>

        {message && <p>{message}</p>}

        {/* Resume Analysis */}
        {analysis && (
          <div>
            <h2>Resume Analysis</h2>

            <h3>Skills</h3>
            <p>
              {analysis.skills?.join(", ") ||
                "No skills found"}
            </p>

            <h3>Education</h3>
            <p>
              {analysis.education ||
                "No education information found"}
            </p>

            <h3>Experience</h3>
            <p>
              {analysis.experience ||
                "No experience information found"}
            </p>

            <h3>Projects</h3>
            <p>
              {analysis.projects
                ?.map((project) =>
                  typeof project === "string"
                    ? project
                    : project.name ||
                      project.title ||
                      JSON.stringify(project)
                )
                .join(", ") ||
                "No projects found"}
            </p>

            <h3>Strengths</h3>
            <p>
              {analysis.strengths?.join(", ") ||
                "No strengths found"}
            </p>

            <h3>Missing Skills</h3>
            <p>
              {analysis.missingSkills?.join(", ") ||
                "No missing skills identified"}
            </p>

            <h3>Resume Score</h3>
            <p>
              {analysis.resumeScore ?? 0}/100
            </p>
          </div>
        )}

        {/* Recommended Jobs */}
        {matchedJobs.length > 0 && (
          <div>
            <h2>Recommended Jobs</h2>

            {/* Job Search */}
            <input
              type="text"
              placeholder="Search jobs by title, company or skill..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />

            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <div key={job.id}>
                  <h3>{job.title}</h3>

                  <p>
                    <strong>Company:</strong>{" "}
                    {job.company}
                  </p>

                  <p>
                    <strong>Match:</strong>{" "}
                    {job.matchPercentage}%
                  </p>

                  <p>
                    <strong>Matched Skills:</strong>{" "}
                    {job.matchedSkills?.join(", ") ||
                      "None"}
                  </p>

                  <p>
                    <strong>Required Skills:</strong>{" "}
                    {job.skills?.join(", ")}
                  </p>

                  <hr />
                </div>
              ))
            ) : (
              <p>No matching jobs found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;