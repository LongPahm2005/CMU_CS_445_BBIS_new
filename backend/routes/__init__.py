from .auth import auth_bp
from .dashboard import dashboard_bp
from .attendance import attendance_bp
from .reports import reports_bp
from .alerts import alerts_bp
from .employees import employees_bp
from .positions import positions_bp
from .departments import departments_bp
from .payroll import payroll_bp

def register_routes(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(employees_bp)
    app.register_blueprint(positions_bp)
    app.register_blueprint(departments_bp)
    app.register_blueprint(payroll_bp)
