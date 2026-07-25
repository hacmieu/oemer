import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import AudioPlayer from "@isamu/osmd-audio-player";

const logEl = document.getElementById("log");
const log = (m, c = "") => (logEl.innerHTML += `<span class="${c}">${m}</span>\n`);

// Cờ để kiểm thử tự động đọc được kết quả
window.__spike = { render: null, audio: null };

const osmd = new OpenSheetMusicDisplay(document.getElementById("score"), {
  autoResize: true,
});
const player = new AudioPlayer();

const xml = await (await fetch("/sample.musicxml")).text();
log(`Đã tải sample.musicxml (${(xml.length / 1024).toFixed(1)} KB)`);

try {
  const t0 = performance.now();
  await osmd.load(xml);
  await osmd.render();
  log(`OSMD parse + render: OK (${Math.round(performance.now() - t0)} ms)`, "ok");
  window.__spike.render = "ok";
} catch (e) {
  log(`OSMD THẤT BẠI: ${e.message}`, "err");
  window.__spike.render = `fail: ${e.message}`;
}

try {
  await player.loadScore(osmd);
  log(`Audio player nạp bản nhạc: OK`, "ok");
  window.__spike.audio = "ok";
} catch (e) {
  log(`Audio player THẤT BẠI: ${e.message}`, "err");
  window.__spike.audio = `fail: ${e.message}`;
}

document.getElementById("play").onclick = () => player.play();
document.getElementById("stop").onclick = () => player.stop();
