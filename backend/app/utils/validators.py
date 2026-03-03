import re

def validar_email(email):
    return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))

def validar_senha(senha):
    if len(senha) < 6:
        return False, 'Senha deve ter pelo menos 6 caracteres'
    return True, None
