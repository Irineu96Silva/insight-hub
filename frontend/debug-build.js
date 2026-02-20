
const { exec } = require('child_process');
const fs = require('fs');

console.log('Starting build...');
exec('npx quasar build', { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
  const log = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
  fs.writeFileSync('build.log', log);
  if (error) {
    console.error(`Build failed: ${error.message}`);
    process.exit(1);
  } else {
    console.log('Build succeeded');
  }
});
