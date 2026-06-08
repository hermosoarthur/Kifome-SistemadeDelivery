# backend/app/utils/pix_utils.py
"""
Gerador de QR Code PIX nativo usando o padrão BR Code (EMV) do Banco Central.
Não depende do Mercado Pago — funciona em localhost e produção.

Variáveis de ambiente:
  PIX_CHAVE      : Chave PIX (CPF, CNPJ, email, telefone ou chave aleatória)
  PIX_NOME       : Nome do recebedor (max 25 chars)
  PIX_CIDADE     : Cidade do recebedor (max 15 chars)
"""
import os
import struct
import io
import base64


def _crc16(data: str) -> str:
    """Calcula CRC16/CCITT-FALSE para o payload PIX."""
    crc = 0xFFFF
    for char in data.encode('utf-8'):
        crc ^= char << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ 0x1021
            else:
                crc <<= 1
            crc &= 0xFFFF
    return format(crc, '04X')


def _campo(id_: str, valor: str) -> str:
    """Formata um campo EMV: ID + tamanho (2 dígitos) + valor."""
    return f"{id_}{len(valor):02d}{valor}"


def gerar_brcode(valor: float, referencia: str, descricao: str = '') -> str:
    """
    Gera o payload BR Code (EMV) do PIX.
    Retorna a string do código PIX copia-e-cola.
    """
    chave = os.environ.get('PIX_CHAVE', '').strip()
    nome = (os.environ.get('PIX_NOME', 'Kifome Delivery') or 'Kifome Delivery')[:25].strip()
    cidade = (os.environ.get('PIX_CIDADE', 'Guarulhos') or 'Guarulhos')[:15].strip()

    if not chave:
        raise ValueError('PIX_CHAVE não configurada no .env')

    # Merchant Account Information (ID 26)
    desc_gui = _campo('00', 'br.gov.bcb.pix')
    desc_chave = _campo('01', chave)
    if descricao:
        desc_chave += _campo('02', descricao[:50])
    mai = _campo('26', desc_gui + desc_chave)

    # Additional Data (ID 62) — txid/referência (max 25 chars alfanuméricos)
    txid = ''.join(c for c in referencia if c.isalnum())[:25] or 'KIFOME'
    add_data = _campo('62', _campo('05', txid))

    # Montar payload sem CRC
    valor_str = f'{valor:.2f}'
    payload = (
        _campo('00', '01')          # Payload Format Indicator
        + _campo('01', '12')        # Point of Initiation (12 = reutilizável)
        + mai                        # Merchant Account Information
        + _campo('52', '0000')      # MCC
        + _campo('53', '986')       # Currency (BRL)
        + _campo('54', valor_str)   # Transaction Amount
        + _campo('58', 'BR')        # Country Code
        + _campo('59', nome)        # Merchant Name
        + _campo('60', cidade)      # Merchant City
        + add_data                   # Additional Data
        + '6304'                     # CRC placeholder
    )

    crc = _crc16(payload)
    return payload + crc


def gerar_qrcode_base64(brcode: str) -> str:
    """Gera imagem QR Code do BR Code e retorna como base64 PNG."""
    import qrcode
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=4,
    )
    qr.add_data(brcode)
    qr.make(fit=True)
    img = qr.make_image(fill_color='black', back_color='white')
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode('utf-8')


def criar_pix_local(pedido, _usuario=None) -> dict:
    """
    Cria um pagamento PIX usando geração local de BR Code.
    Compatível com a interface de criar_pix_mp.
    Retorna: { payment_id, qr_code, qr_code_base64, status, transaction_amount }
    """
    import uuid
    total = float(pedido.total)
    ref = f'PED{pedido.id}'
    descricao = f'Kifome Pedido {pedido.id}'

    brcode = gerar_brcode(total, ref, descricao)
    qr64 = gerar_qrcode_base64(brcode)

    # ID local único para rastrear
    payment_id = f'local_pix_{pedido.id}_{uuid.uuid4().hex[:8]}'

    return {
        'payment_id': payment_id,
        'qr_code': brcode,
        'qr_code_base64': qr64,
        'status': 'pending',
        'transaction_amount': total,
    }
