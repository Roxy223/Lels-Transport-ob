const routeId = window.location.pathname.split("/").pop();
const form = document.getElementById("route-form");

function pad(x) { return (x < 10 ? "0" : "") + x; }

function computeDelayed(t, d) {
  let [h, m] = t.split(":").map(Number);
  m += Number(d);
  h += Math.floor(m / 60);
  m = m % 60;
  if (h >= 24) h -= 24;
  return `${pad(h)}:${pad(m)}`;
}

function refreshUI() {
  document.querySelectorAll(".stop-row").forEach(row => {
    const name = row.querySelector('input[data-field="name"]').value;
    const time = row.querySelector('input[data-field="time"]').value;
    const delay = parseInt(row.querySelector('input[data-field="delay"]').value || 0);

    const updated = computeDelayed(time, delay);

    row.querySelector(".stop-name").textContent = name;
    row.querySelector(".updated-time").textContent = updated;
    row.querySelector(".delay-label").textContent = `(+${delay} min)`;
  });
}

function save() {
  const stops = [];
  document.querySelectorAll(".stop-row").forEach(row => {
    stops.push({
      name: row.querySelector('input[data-field="name"]').value,
      time: row.querySelector('input[data-field="time"]').value,
      delay: row.querySelector('input[data-field="delay"]').value
    });
  });

  fetch(`/api/route/${routeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stops })
  });
}

form.addEventListener("input", () => {
  refreshUI();
  save();
});

// add +1 / -1 / delete
document.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const row = btn.closest(".stop-row");
  if (!row) return;

  const action = btn.dataset.action;
  const delayInput = row.querySelector('input[data-field="delay"]');

  if (action === "add") {
    delayInput.value = parseInt(delayInput.value) + 1;
  } else if (action === "sub") {
    delayInput.value = parseInt(delayInput.value) - 1;
  } else if (action === "delete") {
    row.remove();
  }

  refreshUI();
  save();
});

// Add stop
document.getElementById("add-stop").onclick = () => {
  const container = document.querySelector(".timeline");
  const idx = document.querySelectorAll(".stop-row").length;

  const html = `
    <div class="stop-row" data-index="${idx}">
      <div class="line-area"><div class="line-dot"></div></div>
      <div class="right-card">
        <div class="stop-name">New Stop</div>
        <div class="meta">
          <span class="updated-time">00:00</span>
          <span class="delay-label">(+0 min)</span>
        </div>
        <div class="edit-row">
          <input type="text" data-field="name" value="New Stop">
          <input type="time" data-field="time" value="00:00">
          <input type="number" data-field="delay" value="0">
        </div>
        <div class="edit-buttons">
          <button data-action="sub" class="small-btn">-1</button>
          <button data-action="add" class="small-btn">+1</button>
          <button data-action="delete" class="small-btn del">Delete</button>
        </div>
      </div>
    </div>`;

  container.insertAdjacentHTML("beforeend", html);
  refreshUI();
  save();
};

// Reset all delays to 0
document.getElementById("reset-route").onclick = () => {
  document.querySelectorAll('input[data-field="delay"]').forEach(i => i.value = 0);
  refreshUI();
  save();
};

refreshUI();
