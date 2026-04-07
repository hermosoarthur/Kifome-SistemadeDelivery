"""
Supabase Auth Utilities
Wrapper for Supabase Auth operations with fallback handling
"""
import re
from flask import current_app


_SUPABASE_RUNTIME_PATCHED = False


def patch_supabase_runtime_compat():
    """Patch GoTrue/httpx incompatibility where gotrue passes `proxy` instead of `proxies`."""
    global _SUPABASE_RUNTIME_PATCHED
    if _SUPABASE_RUNTIME_PATCHED:
        return

    try:
        from gotrue import http_clients as gotrue_http_clients
        from gotrue._sync import gotrue_base_api as sync_base_api
        from gotrue._async import gotrue_base_api as async_base_api
        from httpx import Client as HttpxClient, AsyncClient as HttpxAsyncClient
    except Exception:
        return

    if getattr(gotrue_http_clients.SyncClient, '_kifome_proxy_patch', False):
        _SUPABASE_RUNTIME_PATCHED = True
        return

    class PatchedSyncClient(HttpxClient):
        _kifome_proxy_patch = True

        def __init__(self, *args, proxy=None, proxies=None, **kwargs):
            if proxies is None and proxy is not None:
                proxies = proxy
            super().__init__(*args, proxies=proxies, **kwargs)

        def aclose(self):
            self.close()

    class PatchedAsyncClient(HttpxAsyncClient):
        _kifome_proxy_patch = True

        def __init__(self, *args, proxy=None, proxies=None, **kwargs):
            if proxies is None and proxy is not None:
                proxies = proxy
            super().__init__(*args, proxies=proxies, **kwargs)

    gotrue_http_clients.SyncClient = PatchedSyncClient
    gotrue_http_clients.AsyncClient = PatchedAsyncClient
    if hasattr(sync_base_api, 'SyncClient'):
        sync_base_api.SyncClient = PatchedSyncClient
    if hasattr(async_base_api, 'AsyncClient'):
        async_base_api.AsyncClient = PatchedAsyncClient

    _SUPABASE_RUNTIME_PATCHED = True


def normalize_phone(phone):
    """Normalize Brazilian phone numbers to E.164 (+55XXXXXXXXXXX)."""
    if not phone:
        return ''

    digits = re.sub(r'\D', '', phone)
    if digits.startswith('00'):
        digits = digits[2:]
    if not digits:
        return ''

    if digits.startswith('55'):
        normalized = digits
    elif len(digits) in (10, 11):
        normalized = f'55{digits}'
    else:
        normalized = digits

    return f'+{normalized}' if normalized else ''

def get_supabase_client():
    """Get Supabase client instance"""
    supabase_url = current_app.config.get('SUPABASE_URL')
    supabase_key = current_app.config.get('SUPABASE_KEY')
    
    if not supabase_url or not supabase_key:
        return None
    
    try:
        patch_supabase_runtime_compat()
        from supabase import create_client
        return create_client(supabase_url, supabase_key)
    except Exception as e:
        print(f'[Supabase] Failed to create client: {e}')
        return None


def send_magic_link(email):
    """
    Send magic link via Supabase Auth
    
    Returns:
        dict: { 'success': bool, 'error': str|None, 'data': dict }
    """
    sb = get_supabase_client()
    if not sb:
        return {'success': False, 'error': 'Supabase não configurado', 'data': None}
    
    try:
        # Supabase magic link OTP
        response = sb.auth.sign_in_with_otp(
            {
                'email': email,
                'options': {'should_create_user': True}
            }
        )
        return {'success': True, 'error': None, 'data': response}
    except Exception as e:
        return {'success': False, 'error': str(e), 'data': None}


def send_sms_otp(phone):
    """
    Send OTP via SMS using Supabase Phone Auth
    
    Args:
        phone: Phone number in E.164 format (e.g., +5511999999999)
    
    Returns:
        dict: { 'success': bool, 'error': str|None, 'data': dict }
    """
    sb = get_supabase_client()
    if not sb:
        return {'success': False, 'error': 'Supabase não configurado', 'data': None}

    normalized_phone = normalize_phone(phone)
    if not normalized_phone or not normalized_phone.startswith('+'):
        return {'success': False, 'error': 'Telefone inválido. Use DDD + número, ex: +5511999999999', 'data': None}
    
    try:
        response = sb.auth.sign_in_with_otp(
            {
                'phone': normalized_phone,
                'options': {'should_create_user': True}
            }
        )
        return {'success': True, 'error': None, 'data': response, 'phone': normalized_phone}
    except Exception as e:
        return {'success': False, 'error': str(e), 'data': None}


def verify_otp(email_or_phone, otp_code, otp_type='email'):
    """
    Verify OTP code with Supabase Auth
    
    Args:
        email_or_phone: Email or phone number
        otp_code: The OTP code user received
        otp_type: 'email' or 'sms'
    
    Returns:
        dict: { 'success': bool, 'error': str|None, 'user': dict }
    """
    sb = get_supabase_client()
    if not sb:
        return {'success': False, 'error': 'Supabase não configurado', 'user': None}
    
    try:
        if otp_type == 'sms':
            normalized_phone = normalize_phone(email_or_phone)
            response = sb.auth.verify_otp(
                {'phone': normalized_phone, 'token': otp_code, 'type': 'sms'}
            )
        else:
            response = sb.auth.verify_otp(
                {'email': email_or_phone, 'token': otp_code, 'type': 'email'}
            )
        
        if response.user:
            return {'success': True, 'error': None, 'user': response.user.model_dump()}
        return {'success': False, 'error': 'Falha na verificação', 'user': None}
    except Exception as e:
        return {'success': False, 'error': str(e), 'user': None}


def verify_oauth_token(provider, token):
    """
    Verify OAuth token from Google/Facebook
    
    Args:
        provider: 'google' or 'facebook'
        token: Supabase access token or provider ID token
    
    Returns:
        dict: { 'success': bool, 'error': str|None, 'user': dict }
    """
    sb = get_supabase_client()
    if not sb:
        return {'success': False, 'error': 'Supabase não configurado', 'user': None}
    
    try:
        # First try treating token as a Supabase access token (from OAuth callback session)
        try:
            user_response = sb.auth.get_user(token)
            user = getattr(user_response, 'user', None)
            if user:
                return {'success': True, 'error': None, 'user': user.model_dump()}
        except Exception:
            pass

        # Fallback: treat token as provider ID token
        response = sb.auth.sign_in_with_id_token({
            'provider': provider,
            'token': token,
        })
        
        if response.user:
            return {'success': True, 'error': None, 'user': response.user.model_dump()}
        return {'success': False, 'error': 'Token inválido', 'user': None}
    except Exception as e:
        return {'success': False, 'error': str(e), 'user': None}
