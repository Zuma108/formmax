const { spawnSync } = require('child_process');
const data = JSON.stringify({
  site_id: "622e6cd6-d22b-4e72-b51b-3be6698bf481",
  body: { build_settings: { dir: "" } }
});
spawnSync('npx', ['netlify-cli', 'api', 'updateSite', '-d', data], { stdio: 'inherit', shell: true });
