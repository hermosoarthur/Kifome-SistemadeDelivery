"""
OTP Utilities for Email and SMS verification
Supports both local storage and Supabase Auth OTP
"""
import os
import secrets
import bcrypt
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta
from app import db
from flask import current_app

class OtpRequest:
    """OTP Request model for local storage"""
    def __init__(self, tipo, destino, codigo, max_tentativas=3):
        self.tipo = tipo  # 'email' or 'sms'
        self.destino = destino  # email or phone
        self.codigo = codigo  # plain text code (6 digits)
        self.codigo_hash = bcrypt.hashpw(codigo.encode(), bcrypt.gensalt()).decode()
        self.max_tentativas = max_tentativas
        self.tentativas = 0
        self.expiracao = datetime.utcnow() + timedelta(
            minutes=int(os.environ.get('OTP_EXPIRATION_MINUTES', 10))
        )
        self.criado_em = datetime.utcnow()
        self.verificado_em = None

    def is_valid(self):
        """Check if OTP is not expired"""
        return datetime.utcnow() < self.expiracao

    def is_attempts_exceeded(self):
        """Check if max attempts reached"""
        return self.tentativas >= self.max_tentativas

    def verify(self, codigo_input):
        """Verify OTP code"""
        if not self.is_valid():
            return False, 'Código expirado'
        if self.is_attempts_exceeded():
            return False, 'Muitas tentativas. Solicite um novo código'
        
        self.tentativas += 1
        if not bcrypt.checkpw(codigo_input.encode(), self.codigo_hash.encode()):
            return False, f'Código incorreto ({self.max_tentativas - self.tentativas} tentativas restantes)'
        
        self.verificado_em = datetime.utcnow()
        return True, 'OTP verificado com sucesso'


def gerar_codigo_otp(length=6):
    """Generate random OTP code"""
    return ''.join([str(secrets.randbelow(10)) for _ in range(length)])


def salvar_otp_request(tipo, destino, codigo):
    """Save OTP request to database"""
    from app.models import db
    # Dynamic model creation since we need to work with SQLAlchemy
    # This is a helper that will be used by auth_controller
    pass


def obter_otp_request(tipo, destino):
    """Get active OTP request by type and destination"""
    from app.models import AuthOtpRequest
    return AuthOtpRequest.query.filter_by(
        tipo=tipo, 
        destino=destino
    ).filter(
        AuthOtpRequest.expiracao > datetime.utcnow()
    ).order_by(AuthOtpRequest.criado_em.desc()).first()


def limpar_otps_expirados():
    """Clean up expired OTP requests (run periodically)"""
    from app.models import AuthOtpRequest
    expirados = AuthOtpRequest.query.filter(
        AuthOtpRequest.expiracao <= datetime.utcnow()
    ).delete()
    db.session.commit()
    return expirados


def send_email_otp_message(email, codigo, *, purpose='login'):
    """Send OTP code via configured SMTP provider."""
    smtp_host = current_app.config.get('SMTP_HOST')
    smtp_port = current_app.config.get('SMTP_PORT')
    smtp_user = current_app.config.get('SMTP_USER')
    smtp_password = current_app.config.get('SMTP_PASSWORD')
    from_email = current_app.config.get('SMTP_FROM_EMAIL') or smtp_user
    from_name = current_app.config.get('SMTP_FROM_NAME', 'Kifome')
    use_tls = current_app.config.get('SMTP_USE_TLS', True)

    if not smtp_host or not smtp_user or not smtp_password or not from_email:
        return {'success': False, 'error': 'SMTP não configurado no backend'}

    subject = 'Seu código de acesso Kifome'
    if purpose == 'registro':
        subject = 'Seu código para criar conta na Kifome'

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = f'{from_name} <{from_email}>'
    msg['To'] = email
    msg.set_content(
        f'Olá!\n\nSeu código de verificação é: {codigo}\n\n'
        'Esse código expira em 10 minutos.\n'
        'Se você não solicitou esse acesso, ignore este e-mail.\n\n'
        'Equipe Kifome'
    )

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
            if use_tls:
                server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        return {'success': True, 'error': None}
    except Exception as exc:
        return {'success': False, 'error': str(exc)}
