"""Package initializer for app.routes

This module intentionally avoids top-level imports that trigger route
registrations. Route modules are imported explicitly by the application
factory (`create_app`) to keep package import side-effects minimal.
"""

__all__ = []

#
