from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from werkzeug.security import check_password_hash
from db_ops import get_session
from models import Student

app = Flask(__name__)

# SECRET for signing cookies
app.config["SECRET_KEY"] = "super-secret-key-change-me"

# ----- CORS: allow React dev server -----
CORS(
    app,
    resources={r"/api/*": {"origins": ["http://localhost:3000"]}},
    supports_credentials=True,
)

# ----- SIMPLE HEALTH CHECK -----
@app.route("/api/health")
def health():
    return jsonify({"ok": True})


# ----- LOGIN -----
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json

    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "Missing fields"}), 400

    email = data["email"].strip().lower()
    password = data["password"]

    session = get_session()
    user = session.query(Student).filter(Student.email == email).first()

    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401

    # Response payload (uuid/ID + name)
    resp_data = {
        "id": str(user.id),        # change to user.uuid if you have that
        "name": user.name,
    }

    resp = make_response(jsonify(resp_data))
    resp.set_cookie(
        "ecn_session",
        value=str(user.id),
        httponly=True,
        samesite="Lax",
    )

    return resp


# ----- LOGOUT -----
@app.route("/api/logout", methods=["POST"])
def logout():
    resp = make_response(jsonify({"success": True}))
    resp.set_cookie("ecn_session", "", expires=0)
    return resp


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
