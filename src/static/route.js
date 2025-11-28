{% for stop in stops %}
<div class="stop-row" data-index="{{ loop.index0 }}">
  <div class="time-left">{{ stop.updated_time }}</div>

  <div class="line-area"><div class="line-dot"></div></div>

  <div class="right-card">
    <div class="card-row">
      <div>
        <div class="stop-name">{{ stop.name }}</div>
      </div>

      <div style="min-width:210px; text-align:right;">
        <div style="display:flex; gap:8px; justify-content:flex-end; align-items:center;">
          <input type="text" data-field="name" value="{{ stop.name }}" style="width:180px; padding:6px; border-radius:6px; border:1px solid #e5e7eb;">
          <input type="time" data-field="time" value="{{ stop.time }}" style="padding:6px; border-radius:6px; border:1px solid #e5e7eb;">
          <input type="number" data-field="delay" value="{{ stop.delay }}" style="width:68px; padding:6px; border-radius:6px; border:1px solid #e5e7eb;">
        </div>

        <div style="display:flex; gap:6px; justify-content:flex-end; margin-top:8px;">
          <button data-action="sub" class="small-btn">-1</button>
          <button data-action="add" class="small-btn">+1</button>
          <button data-action="delete" class="small-btn" style="background:#ef4444">Delete</button>
        </div>
      </div>
    </div>
  </div>
</div>
{% endfor %}
