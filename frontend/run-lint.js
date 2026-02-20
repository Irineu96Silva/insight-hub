
const { exec } = require("child_process");
const fs = require("fs");

console.log("Starting lint...");
exec("npx eslint \"src/**/*.{js,ts,vue}\" --format json", { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    console.log("Lint finished. Error:", error ? error.message : "None");
    const output = stdout || stderr || "[]";
    fs.writeFileSync("lint_report.json", output, "utf8");
});
