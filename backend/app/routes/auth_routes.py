from flask import Blueprint
from app.controllers.auth_controller import (
    login, me,
    sync_supabase_user,
    request_magic_link, verify_magic_link,
    request_otp_email, verify_otp_email,
    request_otp_sms, verify_otp_sms,
    login_google, login_facebook,
    request_password_reset, verify_password_reset,
    request_otp_email as request_registro_otp,
    verify_otp_email as verify_registro_otp
)
from app.utils.jwt_utils import token_requerido

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Legacy password login
auth_bp.route('/login', methods=['POST'])(login)

# Magic Link (Passwordless)
auth_bp.route('/request_magic_link', methods=['POST'])(request_magic_link)
auth_bp.route('/verify_magic_link', methods=['POST'])(verify_magic_link)

# Email OTP
auth_bp.route('/request_otp_email', methods=['POST'])(request_otp_email)
auth_bp.route('/verify_otp_email', methods=['POST'])(verify_otp_email)

# SMS OTP
auth_bp.route('/request_otp_sms', methods=['POST'])(request_otp_sms)
auth_bp.route('/verify_otp_sms', methods=['POST'])(verify_otp_sms)

# Social Login
auth_bp.route('/login_google', methods=['POST'])(login_google)
auth_bp.route('/login_facebook', methods=['POST'])(login_facebook)

# Password Reset
auth_bp.route('/request_password_reset', methods=['POST'])(request_password_reset)
auth_bp.route('/verify_password_reset', methods=['POST'])(verify_password_reset)

# Current user info
@auth_bp.route('/me', methods=['GET'])
@token_requerido
def rota_me(u):
    return me(u)


# Sync Supabase user to local app user
auth_bp.route('/sync_supabase_user', methods=['POST'])(sync_supabase_user)

#

