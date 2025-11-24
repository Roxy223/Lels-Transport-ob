from flask import Flask, render_template, request, redirect, url_for, session
from datetime import datetime, timedelta

app = Flask(__name__)
app.secret_key = "supersecretkey"  # Use environment variable in production

# Full Line 33 schedule
STOPS = [
    {"name":"Oosterblok","time":"17:53","delay":9},
    {"name":"Baaier","time":"17:54","delay":9},
    {"name":"BosWater","time":"17:55","delay":8},
    {"name":"De veer QD","time":"17:55","delay":7},
    {"name":"brugstraat","time":"17:56","delay":8},
    {"name":"Komerplein","time":"17:56","delay":7},
    {"name":"Oosterbrug","time":"17:57","delay":5},
    {"name":"Oostplein","time":"17:57","delay":9},
    {"name":"Rembrand CNTRL","time":"17:58","delay":10},
    {"name":"Hoogzandweg","time":"17:59","delay":8},
    {"name":"Hogezand Strand","time":"18:00","delay":8},
    {"name":"HZ WalenbW","time":"18:01","delay":11},
    {"name":"Hoogzand Centrum","time":"18:02","delay":12},
    {"name":"Zaandams weg","time":"18:03","delay":7},
    {"name":"Bosweg","time":"18:05","delay":5},
    {"name":"Bergenlaan","time":"18:06","delay":6},
    {"name":"HVBergenlaan","time":"18:07","delay":4},
    {"name":"Zaandam Centrum","time":"18:09","delay":7},
    {"name":"HVBergenlaan","time":"18:11","delay":9},
    {"name":"Bergenlaan","time":"18:12","delay":12},
    {"name":"Bosweg","time":"18:13","delay":6},
    {"name":"Zaandams Weg","time":"18:14","delay":8},
    {"name":"HoogZand Centrum","time":"18:16","delay":12},
    {"name":"HZ WalenBW","time":"18:17","delay":13},
    {"name":"Hoogzandweg","time":"18:18","delay":7},
    {"name":"Rembrand CNTRL","time":"18:19","delay":7},
    {"name":"Oostplein","time":"18:22","delay":7},
    {"name":"De veer QD","time":"18:25","delay":5},
    {"name":"BosWater","time":"18:26","delay":3},
    {"name":"Damweg","time":"18:28","delay":7},
    {"name":"Schuurplein","time":"18:29","delay":12},
    {"name":"Oosterblok","time":"18:30","delay":17},
]

def add_minutes(time_str, minutes):
    h, m = map(int, time_str.split(":"))
    dt = datetime(2000,1,1,h,m) + timedelta(minutes=minutes)
    return dt.strftime("%H:%M")

@app.route("/", methods=["GET", "POST"])
def index():
    if "delays" not in session:
        session["delays"] = [stop["delay"] for stop in STOPS]
    if "times" not in session:
        session["times"] = [stop["time"] for stop in STOPS]

    if request.method == "POST":
        for i, stop in enumerate(STOPS):
            # Increment / decrement delays
            if f"add_delay_{i}" in request.form:
                session["delays"][i] += 1
            if f"subtract_delay_{i}" in request.form:
                session["delays"][i] = max(0, session["delays"][i]-1)

            # Change scheduled time
            if f"time_{i}" in request.form:
                new_time = request.form[f"time_{i}"]
                try:
                    datetime.strptime(new_time, "%H:%M")
                    session["times"][i] = new_time
                except ValueError:
                    pass

        # Reset all button
        if "reset_all" in request.form:
            session["delays"] = [stop["delay"] for stop in STOPS]
            session["times"] = [stop["time"] for stop in STOPS]

        session.modified = True
        return redirect(url_for("index"))

    stops_with_delays = []
    for i, stop in enumerate(STOPS):
        stops_with_delays.append({
            "name": stop["name"],
            "time": session["times"][i],
            "delay": session["delays"][i],
            "delayed_time": add_minutes(session["times"][i], session["delays"][i])
        })

    return render_template("index.html", stops=stops_with_delays)

if __name__ == "__main__":
    app.run(debug=True)
