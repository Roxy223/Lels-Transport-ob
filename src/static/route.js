// src/static/route.js
// Handles add stop, reset, +/- delete, inline edits, autosave
(() => {
  if (!window.ROUTE_ID) {
    console.warn("ROUTE_ID not provided.");
  }
  const routeId = window.ROUTE_ID;

  // Helper: find stops in DOM
  function getStopRows() {
    return Array.from(document.querySelectorAll('.stop-row'));
  }

  // Read current stops from DOM into JS array
  function readStopsFromDOM() {
    return getStopRows().map((row) => {
      return {
        name: row.querySelector('.field-name').value,
        time: row.querySelector('.field-time').value,
        delay: parseInt(row.querySelector('.field-delay').value || '0', 10)
      };
    });
  }

  // Update the visible inline delay next to time for a row element
  function updateDelayInline(row) {
    const timeEl = row.querySelector('.time-left strong');
    const delayEl = row.querySelector('.delay-inline');
    const delayVal = parseInt(row.querySelector('.field-delay').value || '0', 10);
    delayEl.textContent = (delayVal >= 0 ? `(+${delayVal} min)` : `(${delayVal} min)`);
  }

  // Re-render inline delays for all rows
  function refreshAllDelays() {
    getStopRows().forEach(updateDelayInline);
  }

  // Attach event handlers to a row's buttons/inputs
  function wireRow(row) {
    const addBtn = row.querySelector('button[data-action="add"]');
    const subBtn = row.querySelector('button[data-action="sub"]');
    const delBtn = row.querySelector('button[data-action="delete"]');
    const nameInp = row.querySelector('.field-name');
    const timeInp = row.querySelector('.field-time');
    const delayInp = row.querySelector('.field-delay');

    addBtn.onclick = (e) => {
      e.preventDefault();
      delayInp.value = parseInt(delayInp.value || '0', 10) + 1;
      updateDelayInline(row);
      scheduleSave();
    };
    subBtn.onclick = (e) => {
      e.preventDefault();
      delayInp.value = parseInt(delayInp.value || '0', 10) - 1;
      updateDelayInline(row);
      scheduleSave();
    };
    delBtn.onclick = async (e) => {
      e.preventDefault();
      // Remove from DOM
      row.remove();
      scheduleSave();
    };

    // input changes autosave
    [nameInp, timeInp, delayInp].forEach(inp => {
      inp.addEventListener('change', () => {
        updateDelayInline(row);
        scheduleSave();
      });
      inp.addEventListener('input', () => {
        // live update name/time delay if desired
      });
    });
  }

  // Wire existing rows on load
  function wireAllRows() {
    getStopRows().forEach(wireRow);
  }

  // Add a new stop row to DOM (at end, before end-icon)
  function addNewStop(stop = {name: 'New stop', time: '00:00', delay: 0}) {
    const timeline = document.querySelector('.timeline');
    // create DOM fragment similar to template
    const index = getStopRows().length;
    const div = document.createElement('div');
    div.className = 'stop-row';
    div.setAttribute('data-index', index);
    div.innerHTML = `
      <div class="time-left">
        <strong>${stop.time}</strong>
        <div class="delay-inline">(${stop.delay >=0 ? '+' + stop.delay : stop.delay} min)</div>
      </div>
      <div class="line-area"><div class="line-dot"></div></div>
      <div class="right-card">
        <div class="card-row">
          <div>
            <div class="stop-name">${stop.name}</div>
          </div>
          <div style="min-width:210px; text-align:right;">
            <div style="display:flex; gap:8px; justify-content:flex-end; align-items:center;">
              <input class="field-name" type="text" data-field="name" value="${escapeHtml(stop.name)}" style="width:180px; padding:6px; border-radius:6px; border:1px solid #e5e7eb;">
              <input class="field-time" type="time" data-field="time" value="${stop.time}" style="padding:6px; border-radius:6px; border:1px solid #e5e7eb;">
              <input class="field-delay" type="number" data-field="delay" value="${stop.delay}" style="width:68px; padding:6px; border-radius:6px; border:1px solid #e5e7eb;">
            </div>
            <div style="display:flex; gap:6px; justify-content:flex-end; margin-top:8px;">
              <button data-action="sub" type="button" class="small-btn">-1</button>
              <button data-action="add" type="button" class="small-btn">+1</button>
              <button data-action="delete" type="button" class="small-btn" style="background:#ef4444">Delete</button>
            </div>
          </div>
        </div>
      </div>
    `;
    // insert before the end-icon (the last child)
    const endIcon = timeline.querySelector('.end-icon');
    timeline.insertBefore(div, endIcon);
    wireRow(div);
    scheduleSave();
  }

  // Escape helper for basic safety
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  // Reset times & delays: set delays to 0 but keep time values (or recalc if needed)
  function resetTimesAndDelays() {
    getStopRows().forEach(row => {
      const delayInp = row.querySelector('.field-delay');
      delayInp.value = 0;
      updateDelayInline(row);
    });
    scheduleSave();
  }

  // Debounced save to server
  let saveTimer = null;
  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(doSave, 600); // 600ms after last change
  }

  async function doSave() {
    if (!routeId) return;
    const stops = readStopsFromDOM();
    const payload = { stops };
    try {
      const resp = await fetch(`/api/route/${routeId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        console.error('Save failed', await resp.text());
      }
    } catch (err) {
      console.error('Save request error', err);
    }
  }

  // Wire top-level buttons
  function wireTopButtons() {
    const addStop = document.getElementById('add-stop');
    const resetBtn = document.getElementById('reset-route');

    addStop.onclick = (e) => {
      e.preventDefault();
      addNewStop({name: 'New stop', time: '00:00', delay: 0});
    };

    resetBtn.onclick = (e) => {
      e.preventDefault();
      if (!confirm('Reset all delays to 0?')) return;
      resetTimesAndDelays();
    };
  }

  // initial wiring
  wireAllRows();
  wireTopButtons();
  refreshAllDelays();

})();
