"""
Utilitários de integração com o Mercado Pago.
Usa a biblioteca oficial `mercadopago` (pip install mercadopago).
Variáveis de ambiente necessárias:
  - MP_ACCESS_TOKEN  : Access token (produção ou sandbox)
  - MP_PUBLIC_KEY    : Public key (usada no frontend)
  - MP_WEBHOOK_SECRET: (opcional) para validação HMAC de webhooks
"""
import os
import mercadopago


def _sdk():
    token = os.environ.get('MP_ACCESS_TOKEN', '')
    if not token:
        raise RuntimeError('MP_ACCESS_TOKEN não configurado')
    return mercadopago.SDK(token)


def criar_preference_mp(pedido, usuario):
    """Cria uma preference de pagamento no Mercado Pago e retorna o objeto."""
    sdk = _sdk()
    base_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

    items_mp = []
    for item in pedido.itens:
        items_mp.append({
            'id': str(item.produto_id),
            'title': item.produto.nome if item.produto else f'Produto {item.produto_id}',
            'quantity': item.quantidade,
            'unit_price': float(item.preco_unitario),
            'currency_id': 'BRL',
        })

    # Taxa de entrega como item extra
    if pedido.taxa_entrega and float(pedido.taxa_entrega) > 0:
        items_mp.append({
            'id': 'taxa_entrega',
            'title': f'Taxa de entrega ({pedido.tipo_entrega})',
            'quantity': 1,
            'unit_price': float(pedido.taxa_entrega),
            'currency_id': 'BRL',
        })

    back_urls = {
        'success': f'{base_url}/pagamento/retorno?status=aprovado&pedido_id={pedido.id}',
        'failure': f'{base_url}/pagamento/retorno?status=recusado&pedido_id={pedido.id}',
        'pending': f'{base_url}/pagamento/retorno?status=pendente&pedido_id={pedido.id}',
    }

    preference_data = {
        'items': items_mp,
        'payer': {
            'name': usuario.nome or '',
            'email': usuario.email or '',
        },
        'back_urls': back_urls,
        'external_reference': f'pedido_{pedido.id}',
        'statement_descriptor': 'Kifome Delivery',
    }

    # auto_return so funciona com URLs HTTPS publicas, nunca com localhost
    # notification_url so funciona com URLs publicas — omitir em localhost
    webhook_url = os.environ.get('MP_WEBHOOK_URL', '')
    if webhook_url and 'localhost' not in webhook_url and '127.0.0.1' not in webhook_url:
        preference_data['notification_url'] = webhook_url

    result = sdk.preference().create(preference_data)
    resp = result.get('response', {})
    if result.get('status') not in (200, 201):
        raise RuntimeError(f'Erro MP: {resp}')
    return resp


def obter_pagamento_mp(payment_id: str) -> dict:
    """Busca detalhes de um pagamento pelo ID no Mercado Pago."""
    try:
        sdk = _sdk()
        result = sdk.payment().get(payment_id)
        if result.get('status') == 200:
            return result.get('response', {})
        return {}
    except Exception as ex:
        print(f'[MP] Erro ao obter pagamento {payment_id}: {ex}')
        return {}


def criar_pix_mp(pedido, usuario) -> dict:
    """
    Cria um pagamento PIX via Mercado Pago Payments API.
    Retorna: { payment_id, qr_code, qr_code_base64, status, transaction_amount }
    """
    import uuid
    sdk = _sdk()

    total = float(pedido.total)
    descricao = f'Kifome - Pedido #{pedido.id}'

    payment_data = {
        'transaction_amount': total,
        'description': descricao,
        'payment_method_id': 'pix',
        'payer': {
            'email': usuario.email or 'cliente@kifome.app',
            'first_name': (usuario.nome or 'Cliente').split()[0],
            'last_name': ' '.join((usuario.nome or 'Cliente').split()[1:]) or 'Kifome',
        },
        'external_reference': f'pedido_{pedido.id}',
    }

    # X-Idempotency-Key único por tentativa
    idempotency_key = str(uuid.uuid4())

    result = sdk.payment().create(payment_data, {'X-Idempotency-Key': idempotency_key})
    resp = result.get('response', {})

    if result.get('status') not in (200, 201):
        raise RuntimeError(f'Erro MP PIX: {resp}')

    pix_data = resp.get('point_of_interaction', {}).get('transaction_data', {})

    return {
        'payment_id': str(resp.get('id', '')),
        'qr_code': pix_data.get('qr_code', ''),
        'qr_code_base64': pix_data.get('qr_code_base64', ''),
        'status': resp.get('status', 'pending'),
        'transaction_amount': total,
    }
