import os
import secrets
import bcrypt
from datetime import datetime, timedelta
from flask import request, jsonify, current_app
from app import db, get_supabase
from app.models import Usuario, AuthOtpRequest, ResetPasswordToken
from app.utils.jwt_utils import gerar_token
from app.utils.validators import validar_email, validar_senha
from app.utils.otp_utils import send_email_otp_message
from app.utils.supabase_utils import (
    send_magic_link, send_email_otp, send_sms_otp, verify_otp,
    verify_oauth_token, reset_password_email, update_password, normalize_phone
)


def _to_float(value):
    if value is None or value == '':
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _sync_usuario_from_auth(user_data, *, email=None, telefone=None, defaults=None):
    defaults = defaults or {}
    metadata = user_data.get('user_metadata') or {}
    provider_email = (user_data.get('email') or email or '').strip().lower()
    provider_phone = normalize_phone(user_data.get('phone') or telefone or '') if (user_data.get('phone') or telefone) else None

    usuario = None
    if provider_email:
        usuario = Usuario.query.filter_by(email=provider_email).first()
    if not usuario and provider_phone:
        usuario = Usuario.query.filter_by(telefone=provider_phone).first()

    nome_default = defaults.get('nome') or metadata.get('full_name') or metadata.get('name') or (provider_email.split('@')[0] if provider_email else 'Usuário')
    tipo_default = defaults.get('tipo') or metadata.get('tipo') or 'cliente'

    if not usuario:
        usuario = Usuario(
            nome=nome_default,
            email=provider_email or f'phone_{provider_phone.replace("+", "")}@kifome.local',
            telefone=provider_phone,
            tipo=tipo_default,
            supabase_uid=user_data.get('id'),
            avatar_url=metadata.get('avatar_url', '')
        )
        db.session.add(usuario)
    else:
        usuario.nome = defaults.get('nome') or usuario.nome or nome_default
        usuario.tipo = defaults.get('tipo') or usuario.tipo or tipo_default
        usuario.supabase_uid = user_data.get('id')
        if provider_phone:
            usuario.telefone = provider_phone
        if metadata.get('avatar_url'):
            usuario.avatar_url = metadata.get('avatar_url')

    if defaults.get('telefone'):
        usuario.telefone = normalize_phone(defaults['telefone'])

    endereco_principal = (defaults.get('endereco_principal') or '').strip() if defaults.get('endereco_principal') else ''
    if endereco_principal:
        usuario.endereco_principal = endereco_principal
        usuario.tem_endereco = True

    endereco_json = defaults.get('endereco_json')
    if isinstance(endereco_json, dict):
        usuario.endereco_json = endereco_json

    lat = _to_float(defaults.get('latitude'))
    lng = _to_float(defaults.get('longitude'))
    if lat is not None:
        usuario.latitude = lat
    if lng is not None:
        usuario.longitude = lng

    db.session.commit()
    return usuario

# ============================================================================
# MAGIC LINK (Passwordless)
# ============================================================================

def request_magic_link():
    """Request a magic link via email for passwordless login"""
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()

    if not email or not validar_email(email):
        return jsonify({'erro': 'Email inválido'}), 400

    # Try Supabase first
    sb = get_supabase()
    if sb:
        result = send_magic_link(email)
        if result['success']:
            return jsonify({
                'mensagem': 'Verifique seu email para o link de login',
                'email': email
            }), 200
        return jsonify({'erro': result['error']}), 400

    return jsonify({'erro': 'Supabase não configurado'}), 503


def verify_magic_link(token):
    """
    Verify magic link token and return JWT for backend
    Note: Frontend should handle Supabase session from magic link
    This endpoint syncs Supabase user with local Usuario
    """
    sb = get_supabase()
    if not sb:
        return jsonify({'erro': 'Supabase não configurado'}), 503

    try:
        # Exchange Supabase session for backend JWT
        session = sb.auth.get_session()
        if session and session.user:
            user_data = session.user.model_dump()
            email = user_data.get('email', '').lower()
            
            # Sync or create local user
            usuario = Usuario.query.filter_by(email=email).first()
            if not usuario:
                usuario = Usuario(
                    nome=user_data.get('user_metadata', {}).get('full_name', email.split('@')[0]),
                    email=email,
                    tipo=user_data.get('user_metadata', {}).get('tipo', 'cliente'),
                    supabase_uid=user_data.get('id')
                )
                db.session.add(usuario)
                db.session.commit()
            else:
                usuario.supabase_uid = user_data.get('id')
                db.session.commit()
            
            token = gerar_token(usuario.id, usuario.tipo)
            return jsonify({'token': token, 'usuario': usuario.to_dict()}), 200
    except Exception as e:
        pass

    return jsonify({'erro': 'Falha ao verificar magic link'}), 401


# ============================================================================
# OTP VIA EMAIL
# ============================================================================

def request_otp_email():
    """Request OTP code via email"""
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()

    if not email or not validar_email(email):
        return jsonify({'erro': 'Email inválido'}), 400

    codigo = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    codigo_hash = bcrypt.hashpw(codigo.encode(), bcrypt.gensalt()).decode()
    expiracao = datetime.utcnow() + timedelta(
        minutes=int(os.environ.get('OTP_EXPIRATION_MINUTES', 10))
    )
    
    otp = AuthOtpRequest(
        tipo='email',
        destino=email,
        codigo_hash=codigo_hash,
        expiracao=expiracao
    )
    db.session.add(otp)
    db.session.commit()

    email_result = send_email_otp_message(email, codigo)
    if not email_result['success']:
        current_app.logger.warning('[OTP Email] SMTP falhou para %s: %s', email, email_result['error'])
        print(f'[OTP] Email fallback terminal: {email} -> Código: {codigo}')
        return jsonify({
            'mensagem': 'SMTP não configurado ou falhou. Consulte o terminal do backend para ver o código OTP.',
            'email': email,
            'provider': 'local-dev',
            'erro_envio': email_result['error']
        }), 200

    return jsonify({
        'mensagem': 'Código enviado para seu email',
        'email': email,
        'provider': 'smtp'
    }), 200


def verify_otp_email():
    """Verify OTP code received via email"""
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()
    codigo = data.get('codigo', '').strip()
    nome = data.get('nome', '').strip()
    telefone = data.get('telefone', '').strip()
    tipo = data.get('tipo', '').strip() or 'cliente'
    endereco_principal = (data.get('endereco_principal') or '').strip()
    endereco_json = data.get('endereco_json') if isinstance(data.get('endereco_json'), dict) else None
    latitude = _to_float(data.get('latitude'))
    longitude = _to_float(data.get('longitude'))

    if not email or not codigo:
        return jsonify({'erro': 'Email e código obrigatórios'}), 400
    if data.get('latitude') not in (None, '') and latitude is None:
        return jsonify({'erro': 'Latitude inválida'}), 400
    if data.get('longitude') not in (None, '') and longitude is None:
        return jsonify({'erro': 'Longitude inválida'}), 400

    otp = AuthOtpRequest.query.filter_by(
        tipo='email',
        destino=email
    ).order_by(AuthOtpRequest.criado_em.desc()).first()

    if not otp:
        return jsonify({'erro': 'Código não encontrado ou expirado'}), 401
    
    if datetime.utcnow() > otp.expiracao:
        db.session.delete(otp)
        db.session.commit()
        return jsonify({'erro': 'Código expirado'}), 401
    
    if otp.tentativas >= otp.max_tentativas:
        db.session.delete(otp)
        db.session.commit()
        return jsonify({'erro': 'Muitas tentativas. Solicite um novo código'}), 401
    
    otp.tentativas += 1
    if not bcrypt.checkpw(codigo.encode(), otp.codigo_hash.encode()):
        db.session.commit()
        return jsonify({'erro': f'Código incorreto ({otp.max_tentativas - otp.tentativas} tentativas restantes)'}), 401
    
    otp.verificado_em = datetime.utcnow()
    db.session.commit()
    
    # Find or create user
    usuario = Usuario.query.filter_by(email=email).first()
    if not usuario:
        usuario = Usuario(
            nome=nome or email.split('@')[0],
            email=email,
            telefone=normalize_phone(telefone) if telefone else None,
            tipo=tipo,
            endereco_principal=endereco_principal or None,
            endereco_json=endereco_json,
            latitude=latitude,
            longitude=longitude,
            tem_endereco=bool(endereco_principal)
        )
        db.session.add(usuario)
        db.session.commit()
    else:
        if nome:
            usuario.nome = nome
        if telefone:
            usuario.telefone = normalize_phone(telefone)
        if tipo:
            usuario.tipo = tipo or usuario.tipo
        if endereco_principal:
            usuario.endereco_principal = endereco_principal
            usuario.tem_endereco = True
        if endereco_json:
            usuario.endereco_json = endereco_json
        if latitude is not None:
            usuario.latitude = latitude
        if longitude is not None:
            usuario.longitude = longitude
        db.session.commit()
    
    token = gerar_token(usuario.id, usuario.tipo)
    return jsonify({'token': token, 'usuario': usuario.to_dict()}), 200

#


# ============================================================================
# OTP VIA SMS
# ============================================================================

def request_otp_sms():
    """Request OTP code via SMS"""
    data = request.get_json(silent=True) or {}
    telefone = data.get('telefone', '').strip()
    telefone_normalizado = normalize_phone(telefone)

    if not telefone_normalizado:
        return jsonify({'erro': 'Telefone obrigatório'}), 400

    provider = current_app.config.get('SMS_PROVIDER', 'supabase')

    # Supabase is the primary provider for SMS OTP
    if provider != 'supabase':
        return jsonify({
            'erro': 'O login por SMS deste projeto está configurado para usar Supabase. Ajuste SMS_PROVIDER=supabase no backend.'
        }), 503

    sb = get_supabase()
    if not sb:
        if not current_app.config.get('DEV_SMS_FALLBACK_ENABLED', True):
            return jsonify({
                'erro': 'Supabase não configurado para SMS. Verifique SUPABASE_URL, SUPABASE_KEY e a configuração Phone Auth no painel.'
            }), 503
    else:
        result = send_sms_otp(telefone_normalizado)
        if result['success']:
            return jsonify({
                'mensagem': 'Código enviado por SMS',
                'telefone': result.get('phone', telefone_normalizado),
                'provider': 'supabase'
            }), 200
        erro_supabase = result.get('error') or 'Erro desconhecido ao enviar OTP por SMS.'
        current_app.logger.warning('[OTP SMS] Supabase falhou para %s: %s', telefone_normalizado, erro_supabase)

        if not current_app.config.get('DEV_SMS_FALLBACK_ENABLED', True):
            erro_explicitado = erro_supabase
            if 'alpha' in erro_supabase.lower() or 'sender' in erro_supabase.lower():
                erro_explicitado = (
                    f'{erro_supabase} '
                    'Se você estiver usando Alpha Sender ID na Twilio, verifique se esse tipo de remetente é aceito para o país do número de destino e para OTP.'
                )
            return jsonify({
                'erro': f'Falha ao enviar SMS via Supabase: {erro_explicitado}'
            }), 503

    # Fallback: local/dev OTP storage
    codigo = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    codigo_hash = bcrypt.hashpw(codigo.encode(), bcrypt.gensalt()).decode()
    expiracao = datetime.utcnow() + timedelta(
        minutes=current_app.config.get('OTP_EXPIRATION_MINUTES', 10)
    )
    
    otp = AuthOtpRequest(
        tipo='sms',
        destino=telefone_normalizado,
        codigo_hash=codigo_hash,
        expiracao=expiracao
    )
    db.session.add(otp)
    db.session.commit()

    current_app.logger.warning('[OTP SMS] Fallback local-dev ativo para %s. Código: %s', telefone_normalizado, codigo)
    current_app.logger.warning('[OTP SMS] Motivo do fallback para %s: %s', telefone_normalizado, erro_supabase if 'erro_supabase' in locals() else 'Supabase client não inicializado.')
    print(f'[OTP SMS] Phone: {telefone_normalizado} -> Código: {codigo}')
    
    return jsonify({
        'mensagem': 'SMS indisponível no provedor atual. Em ambiente de desenvolvimento, consulte o terminal do backend para ver o código OTP gerado.',
        'telefone': telefone_normalizado,
        'provider': 'local-dev',
        'fallback': True,
        'debug_provider_error': erro_supabase if 'erro_supabase' in locals() else 'Supabase client não inicializado.'
    }), 200


def verify_otp_sms():
    """Verify OTP code received via SMS"""
    data = request.get_json(silent=True) or {}
    telefone = data.get('telefone', '').strip()
    codigo = data.get('codigo', '').strip()
    nome = data.get('nome', '').strip()
    email = data.get('email', '').strip().lower()
    tipo = data.get('tipo', '').strip() or 'cliente'
    endereco_principal = (data.get('endereco_principal') or '').strip()
    endereco_json = data.get('endereco_json') if isinstance(data.get('endereco_json'), dict) else None
    latitude = _to_float(data.get('latitude'))
    longitude = _to_float(data.get('longitude'))
    telefone_normalizado = normalize_phone(telefone)

    if not telefone_normalizado or not codigo:
        return jsonify({'erro': 'Telefone e código obrigatórios'}), 400
    if data.get('latitude') not in (None, '') and latitude is None:
        return jsonify({'erro': 'Latitude inválida'}), 400
    if data.get('longitude') not in (None, '') and longitude is None:
        return jsonify({'erro': 'Longitude inválida'}), 400

    provider = current_app.config.get('SMS_PROVIDER', 'supabase')

    # Supabase is the primary provider for SMS OTP verification
    if provider == 'supabase':
        sb = get_supabase()
        if sb:
            result = verify_otp(telefone_normalizado, codigo, 'sms')
            if result['success']:
                user_data = result['user']
                usuario = _sync_usuario_from_auth(
                    user_data,
                    email=email,
                    telefone=telefone_normalizado,
                    defaults={
                        'nome': nome,
                        'email': email,
                        'telefone': telefone_normalizado,
                        'tipo': tipo,
                        'endereco_principal': endereco_principal,
                        'endereco_json': endereco_json,
                        'latitude': latitude,
                        'longitude': longitude
                    }
                )
                token = gerar_token(usuario.id, usuario.tipo)
                return jsonify({'token': token, 'usuario': usuario.to_dict()}), 200

            current_app.logger.warning('[OTP SMS] Verificação Supabase falhou para %s: %s', telefone_normalizado, result['error'])
            if not current_app.config.get('DEV_SMS_FALLBACK_ENABLED', True):
                erro_supabase = result['error']
                if 'alpha' in erro_supabase.lower() or 'sender' in erro_supabase.lower():
                    erro_supabase = (
                        f'{erro_supabase} '
                        'Confira a configuração do Alpha Sender ID na Twilio e a compatibilidade com o país do número que receberá o OTP.'
                    )
                return jsonify({'erro': erro_supabase}), 401
        elif not current_app.config.get('DEV_SMS_FALLBACK_ENABLED', True):
            return jsonify({'erro': 'Supabase não configurado para verificar OTP por SMS'}), 503

    # Fallback: local OTP verification
    otp = AuthOtpRequest.query.filter_by(
        tipo='sms',
        destino=telefone_normalizado
    ).order_by(AuthOtpRequest.criado_em.desc()).first()

    if not otp:
        return jsonify({'erro': 'Código não encontrado ou expirado'}), 401
    
    if datetime.utcnow() > otp.expiracao:
        db.session.delete(otp)
        db.session.commit()
        return jsonify({'erro': 'Código expirado'}), 401
    
    if otp.tentativas >= otp.max_tentativas:
        db.session.delete(otp)
        db.session.commit()
        return jsonify({'erro': 'Muitas tentativas. Solicite um novo código'}), 401
    
    otp.tentativas += 1
    if not bcrypt.checkpw(codigo.encode(), otp.codigo_hash.encode()):
        db.session.commit()
        return jsonify({'erro': f'Código incorreto ({otp.max_tentativas - otp.tentativas} tentativas restantes)'}), 401
    
    otp.verificado_em = datetime.utcnow()
    db.session.commit()
    
    # Find or create user by phone
    usuario = Usuario.query.filter_by(telefone=telefone_normalizado).first()
    if not usuario:
        usuario = Usuario(
            nome=nome or 'Usuário',
            email=email or f'phone_{telefone_normalizado.replace("+", "")}@kifome.local',
            telefone=telefone_normalizado,
            tipo=tipo,
            endereco_principal=endereco_principal or None,
            endereco_json=endereco_json,
            latitude=latitude,
            longitude=longitude,
            tem_endereco=bool(endereco_principal)
        )
        db.session.add(usuario)
        db.session.commit()
    else:
        if nome:
            usuario.nome = nome
        if email:
            usuario.email = email
        usuario.telefone = telefone_normalizado
        if tipo:
            usuario.tipo = tipo or usuario.tipo
        if endereco_principal:
            usuario.endereco_principal = endereco_principal
            usuario.tem_endereco = True
        if endereco_json:
            usuario.endereco_json = endereco_json
        if latitude is not None:
            usuario.latitude = latitude
        if longitude is not None:
            usuario.longitude = longitude
        db.session.commit()
    
    token = gerar_token(usuario.id, usuario.tipo)
    return jsonify({'token': token, 'usuario': usuario.to_dict()}), 200


# ============================================================================
# SOCIAL LOGIN (Google + Facebook)
# ============================================================================

def login_google():
    """Login with Google via Supabase OAuth"""
    data = request.get_json(silent=True) or {}
    access_token = data.get('access_token')
    id_token = data.get('id_token')
    user_payload = data.get('user') or {}

    if not (access_token or id_token or user_payload):
        return jsonify({'erro': 'Dados do Google obrigatórios'}), 400

    sb = get_supabase()
    if not sb:
        return jsonify({'erro': 'Supabase não configurado'}), 503

    try:
        if user_payload:
            user_data = user_payload
        else:
            result = verify_oauth_token('google', id_token or access_token)
            if not result['success']:
                return jsonify({'erro': result['error']}), 401
            user_data = result['user']

        email = user_data.get('email', '').lower()
        if not email:
            return jsonify({'erro': 'Conta Google sem e-mail disponível'}), 400

        metadata = user_data.get('user_metadata', {}) or {}

        # Login Google deve concluir direto, mesmo em primeiro acesso
        usuario = _sync_usuario_from_auth(
            user_data,
            email=email,
            telefone=user_data.get('phone', ''),
            defaults={
                'nome': metadata.get('full_name') or metadata.get('name') or email.split('@')[0],
                'tipo': metadata.get('tipo') or 'cliente',
            }
        )
        
        token = gerar_token(usuario.id, usuario.tipo)
        return jsonify({'token': token, 'usuario': usuario.to_dict()}), 200
    except Exception as e:
        return jsonify({'erro': f'Erro Google: {str(e)}'}), 401


def login_facebook():
    """Login with Facebook via Supabase OAuth"""
    data = request.get_json(silent=True) or {}
    access_token = data.get('access_token')
    user_payload = data.get('user') or {}

    if not access_token and not user_payload:
        return jsonify({'erro': 'Token do Facebook obrigatório'}), 400

    sb = get_supabase()
    if not sb:
        return jsonify({'erro': 'Supabase não configurado'}), 503

    try:
        if user_payload:
            user_data = user_payload
        else:
            result = verify_oauth_token('facebook', access_token)
            if not result['success']:
                return jsonify({'erro': result['error']}), 401
            user_data = result['user']

        email = user_data.get('email', '')
        if not email:
            return jsonify({'erro': 'Facebook account must have email'}), 400
        
        email = email.lower()
        
        metadata = user_data.get('user_metadata', {}) or {}
        usuario = _sync_usuario_from_auth(
            user_data,
            email=email,
            telefone=user_data.get('phone', ''),
            defaults={
                'nome': metadata.get('full_name') or metadata.get('name') or email.split('@')[0],
                'tipo': metadata.get('tipo') or 'cliente',
            }
        )
        
        token = gerar_token(usuario.id, usuario.tipo)
        return jsonify({'token': token, 'usuario': usuario.to_dict()}), 200
    except Exception as e:
        return jsonify({'erro': f'Erro Facebook: {str(e)}'}), 401


# ============================================================================
# PASSWORD RESET (Supabase Reset Email + Passwordless Alternative)
# ============================================================================

def request_password_reset():
    """Request password reset link via Supabase"""
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()

    if not email or not validar_email(email):
        return jsonify({'erro': 'Email inválido'}), 400

    sb = get_supabase()
    if not sb:
        return jsonify({'erro': 'Supabase não configurado'}), 503

    try:
        result = reset_password_email(email)
        if result['success']:
            return jsonify({
                'mensagem': 'Link de reset enviado para seu email'
            }), 200
        return jsonify({'erro': result['error']}), 400
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


def verify_password_reset():
    """Verify reset token and update password"""
    data = request.get_json(silent=True) or {}
    token = data.get('token', '').strip()
    nova_senha = data.get('nova_senha', '')

    if not token or not nova_senha:
        return jsonify({'erro': 'Token e nova senha obrigatórios'}), 400

    ok, msg = validar_senha(nova_senha)
    if not ok:
        return jsonify({'erro': msg}), 400

    try:
        reset_token = ResetPasswordToken.query.filter_by(
            token_hash=token,
            usado=False
        ).filter(
            ResetPasswordToken.expiracao > datetime.utcnow()
        ).first()

        if not reset_token:
            return jsonify({'erro': 'Token inválido ou expirado'}), 401

        usuario = reset_token.usuario
        usuario.set_senha(nova_senha)
        reset_token.usado = True
        reset_token.verificado_em = datetime.utcnow()
        db.session.commit()

        token_jwt = gerar_token(usuario.id, usuario.tipo)
        return jsonify({
            'mensagem': 'Senha atualizada com sucesso',
            'token': token_jwt,
            'usuario': usuario.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': str(e)}), 500


# ============================================================================
# LEGACY PASSWORD LOGIN (Fallback)
# ============================================================================

def login():
    """Traditional password login (legacy / fallback)"""
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()
    senha = data.get('senha', '')

    if not email or not senha:
        return jsonify({'erro': 'Email e senha obrigatórios'}), 400

    usuario = Usuario.query.filter_by(email=email, ativo=True).first()
    if not usuario or not usuario.verificar_senha(senha):
        return jsonify({'erro': 'Email ou senha incorretos'}), 401

    token = gerar_token(usuario.id, usuario.tipo)
    return jsonify({'token': token, 'usuario': usuario.to_dict()}), 200


# ============================================================================
# USER INFO
# ============================================================================

def me(usuario_atual):
    """Get current authenticated user info"""
    return jsonify({'usuario': usuario_atual.to_dict()}), 200


def sync_supabase_user():
    """Sync authenticated Supabase user with local app user and return backend JWT."""
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()
    supabase_uid = data.get('supabase_uid', '').strip()
    nome = data.get('nome', '').strip()
    telefone = data.get('telefone', '').strip()
    tipo = data.get('tipo', '').strip() or 'cliente'
    avatar_url = data.get('avatar_url', '').strip()

    if not email or not supabase_uid:
        return jsonify({'erro': 'Email e supabase_uid são obrigatórios'}), 400

    user_data = {
        'id': supabase_uid,
        'email': email,
        'phone': telefone,
        'user_metadata': {
            'full_name': nome,
            'tipo': tipo,
            'avatar_url': avatar_url,
        }
    }

    usuario = _sync_usuario_from_auth(
        user_data,
        email=email,
        telefone=telefone,
        defaults={
            'nome': nome,
            'telefone': telefone,
            'tipo': tipo,
            'avatar_url': avatar_url,
        }
    )

    token = gerar_token(usuario.id, usuario.tipo)
    return jsonify({'token': token, 'usuario': usuario.to_dict()}), 200
