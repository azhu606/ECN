from flask import Flask
from routes import api_bp  # your blueprint file
from db_ops import create_all  # helper to create tables

def create_app():
    app = Flask(__name__)

    # PostgreSQL connection (no password)
    app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql+psycopg2://postgres@127.0.0.1:5432/ecn"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Register blueprints
    app.register_blueprint(api_bp, url_prefix="/api")

    # Health check route
    @app.get("/api/health")
    def health():
        return {"ok": True}

    # Optionally create all tables at startup (for dev use only)
    with app.app_context():
        create_all()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
