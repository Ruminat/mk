const app = document.getElementById("app")!;

function createMoodTracker() {
  const container = document.createElement("div");
  container.innerHTML = `
        <h2>How are you feeling today?</h2>
        <div style="margin: 1rem 0;">
            <button onclick="setMood('happy')">😊 Happy</button>
            <button onclick="setMood('sad')">😢 Sad</button>
            <button onclick="setMood('angry')">😠 Angry</button>
            <button onclick="setMood('calm')">😌 Calm</button>
        </div>
        <div id="mood-display"></div>
    `;
  return container;
}

function setMood(mood: number) {
  const display = document.getElementById("mood-display")!;
  display.innerHTML = `<p>You're feeling: <strong>${mood}</strong></p>`;
  console.log("Mood set to:", mood);
}

app.appendChild(createMoodTracker());

// Make function globally available for buttons
window.setMood = setMood;
