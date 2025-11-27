import json
import os
from flask import Flask, render_template, jsonify, request, abort

from datetime import datetime, timedelta

APP_ROOT = os.path.dirname(__file__)
ROUTES_FILE = os.path.join(APP_ROOT, "routes.json")

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False


def load_routes():
    if not os.path.exists(ROUTES_FILE):
        return {"routes": {}}
    with open(ROUTES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_routes(data):
    with open(ROUTES_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def add_minutes(time_str, minutes):
    h, m = map(int, time_str.split(":"))
    dt = datetime(2000, 1, 1, h, m) + timedelta(minutes=minutes)
    return dt.strftime("%H:%M")


@app.route("/")
def home():
    data = load_routes()
    routes = data.get("routes", {})
    return render_template("index.html", routes=routes)


@app.route("/route/<route_id>")
def view_route(route_id):
    data = load_routes()
    route = data.get("routes", {}).get(route_id)
    if not route:
        abort(404)
    # compute updated times
    stops = []
    for s in route["stops"]:
        updated = add_minutes(s["time"], s.get("delay", 0))
        stops.append({
            "name": s["name"],
            "time": s["time"],
            "delay": s.get("delay", 0),
            "updated_time": updated,
            "is_delayed": s.get("delay", 0) != 0
        })
    return render_template("route.html", route=route, stops=stops)


# API: get route JSON
@app.route("/api/route/<route_id>", methods=["GET"])
def api_get_route(route_id):
    data = load_routes()
    route = data.get("routes", {}).get(route_id)
    if not route:
        return jsonify({"error": "not found"}), 404
    return jsonify(route)


# API: save whole route (used by autosave)
@app.route("/api/route/<route_id>", methods=["POST"])
def api_save_route(route_id):
    data = load_routes()
    routes = data.setdefault("routes", {})
    route = routes.get(route_id)
    if not route:
        return jsonify({"error": "not found"}), 404

    payload = request.get_json()
    if not payload:
        return jsonify({"error": "no json"}), 400

    # validate minimal structure: title + stops list
    title = payload.get("title", route.get("title"))
    stops = payload.get("stops")
    if not isinstance(stops, list):
        return jsonify({"error": "stops must be list"}), 400

    # sanitize each stop entry
    cleaned = []
    for s in stops:
        name = str(s.get("name", "")).strip()
        time = s.get("time", "")
        try:
            datetime.strptime(time, "%H:%M")
        except Exception:
            time = "00:00"
        try:
            delay = int(float(s.get("delay", 0)))
        except Exception:
            delay = 0
        cleaned.append({"name": name, "time": time, "delay": delay})

    routes[route_id] = {"id": route_id, "title": title, "stops": cleaned}
    data["routes"] = routes
    save_routes(data)
    return jsonify({"ok": True})


# API: create new route
@app.route("/api/route", methods=["POST"])
def api_create_route():
    payload = request.get_json()
    if not payload or "title" not in payload:
        return jsonify({"error": "title required"}), 400
    rid = payload.get("id") or payload["title"].lower().replace(" ", "-")
    data = load_routes()
    if rid in data.get("routes", {}):
        # ensure unique id
        suffix = 1
        base = rid
        while rid in data.get("routes", {}):
            rid = f"{base}-{suffix}"
            suffix += 1
    stops = payload.get("stops", [])
    # basic cleanup
    cleaned = []
    for s in stops:
        cleaned.append({
            "name": s.get("name", ""),
            "time": s.get("time", "00:00"),
            "delay": int(float(s.get("delay", 0)))
        })
    data.setdefault("routes", {})[rid] = {"id": rid, "title": payload["title"], "stops": cleaned}
    save_routes(data)
    return jsonify({"ok": True, "id": rid}), 201


# API: add stop (append)
@app.route("/api/route/<route_id>/add_stop", methods=["POST"])
def api_add_stop(route_id):
    payload = request.get_json()
    if not payload:
        return jsonify({"error": "missing json"}), 400
    name = payload.get("name", "New stop")
    time = payload.get("time", "00:00")
    delay = int(float(payload.get("delay", 0)))
    data = load_routes()
    route = data.get("routes", {}).get(route_id)
    if not route:
        return jsonify({"error": "not found"}), 404
    route["stops"].append({"name": name, "time": time, "delay": delay})
    save_routes(data)
    return jsonify({"ok": True})


# API: delete stop by index
@app.route("/api/route/<route_id>/delete_stop", methods=["POST"])
def api_delete_stop(route_id):
    payload = request.get_json()
    idx = payload.get("index")
    if idx is None:
        return jsonify({"error": "index required"}), 400
    data = load_routes()
    route = data.get("routes", {}).get(route_id)
    if not route:
        return jsonify({"error": "not found"}), 404
    try:
        idx = int(idx)
        route["stops"].pop(idx)
        save_routes(data)
        return jsonify({"ok": True})
    except Exception:
        return jsonify({"error": "bad index"}), 400


if __name__ == "__main__":
    app.run(debug=True)
