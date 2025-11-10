from flask import Flask
from flask_cors import CORS
from routes import api_bp
from db_ops import create_all

def create_app():
    app = Flask(__name__)
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
    app.register_blueprint(api_bp)  # only once

    @app.get("/api/health")
    def health():
        return {"ok": True}

    with app.app_context():
        create_all()

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
