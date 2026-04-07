import re

def validar_email(email):
    if not email:
        return False
    email = email.strip().lower()
    if len(email) < 5 or len(email) > 150:
        return False
    return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))


def validar_telefone(telefone):
    if telefone is None:
        return True
    somente_digitos = ''.join(ch for ch in str(telefone) if ch.isdigit())
    return 10 <= len(somente_digitos) <= 15


def normalizar_telefone(telefone):
    if telefone is None:
        return None
    somente_digitos = ''.join(ch for ch in str(telefone) if ch.isdigit())
    return somente_digitos or None


def validar_tipo_usuario(tipo):
    return (tipo or '').strip().lower() in {'cliente', 'restaurante', 'entregador', 'administrador'}
