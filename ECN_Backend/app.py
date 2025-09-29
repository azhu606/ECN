from flask import Flask
from models import db
from routes import api_bp  # blueprint with GET/POST endpoints

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql+psycopg2://user:password@localhost:5432/clubhub"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    app.register_blueprint(api_bp, url_prefix="/api")

    @app.get("/api/health")
    def health():
        return {"ok": True}

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)