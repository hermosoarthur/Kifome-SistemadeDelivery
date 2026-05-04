import os
import importlib.util
from dotenv import load_dotenv
load_dotenv()


def _module_available(module_name):
    return importlib.util.find_spec(module_name) is not None


def _normalize_database_url(url):
    if not url:
        return 'sqlite:///kifome.db'
    if url.startswith('postgresql://') and '+psycopg' not in url and '+psycopg2' not in url:
        if _module_available('psycopg'):
            return url.replace('postgresql://', 'postgresql+psycopg://', 1)
        if _module_available('psycopg2'):
            return url.replace('postgresql://', 'postgresql+psycopg2://', 1)
    return url


def _build_engine_options(database_uri):
    options = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }

    # This argument is only supported by psycopg (PostgreSQL driver).
    if database_uri.startswith('postgresql+psycopg://'):
        options['connect_args'] = {
            'prepare_threshold': None,
        }

    return options


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-kifome-secret')
    SQLALCHEMY_DATABASE_URI = _normalize_database_url(
        os.environ.get('DATABASE_URL', 'sqlite:///kifome.db'))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = _build_engine_options(SQLALCHEMY_DATABASE_URI)
    JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))
    SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
    SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')
    SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
    SMTP_HOST = os.environ.get('SMTP_HOST', '')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
    SMTP_USER = os.environ.get('SMTP_USER', '')
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
    SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL', '')
    SMTP_FROM_NAME = os.environ.get('SMTP_FROM_NAME', 'Kifome')
    SMTP_USE_TLS = os.environ.get('SMTP_USE_TLS', 'true').lower() == 'true'
    OTP_EXPIRATION_MINUTES = int(os.environ.get('OTP_EXPIRATION_MINUTES', 10))
    SMS_PROVIDER = os.environ.get('SMS_PROVIDER', 'supabase').strip().lower()
    DEV_SMS_FALLBACK_ENABLED = os.environ.get(
        'DEV_SMS_FALLBACK_ENABLED', 'true').lower() == 'true'


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
}

#
