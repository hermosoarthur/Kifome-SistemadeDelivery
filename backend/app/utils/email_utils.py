# Arquivo: backend/app/utils/email_utils.py
"""Utilitário para envio de e-mails com anexo usando smtplib."""

import logging
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)


def enviar_email_com_anexo(
    destinatario: str,
    assunto: str,
    corpo_html: str,
    anexo_bytes: bytes,
    nome_arquivo: str,
) -> bool:
    """Envia um e-mail com anexo binário (ex.: PDF).

    Lê as configurações SMTP do ``current_app.config`` do Flask.
    Retorna ``True`` em caso de sucesso, ``False`` caso contrário.
    Nunca levanta exceção — todos os erros são apenas logados.
    """
    try:
        from flask import current_app  # import tardio para evitar circular

        smtp_host = current_app.config.get('SMTP_HOST', '')
        smtp_port = int(current_app.config.get('SMTP_PORT', 587))
        smtp_user = current_app.config.get('SMTP_USER', '')
        smtp_password = current_app.config.get('SMTP_PASSWORD', '')
        from_email = current_app.config.get('SMTP_FROM_EMAIL', smtp_user)
        from_name = current_app.config.get('SMTP_FROM_NAME', 'Kifome')
        use_tls = current_app.config.get('SMTP_USE_TLS', True)

        if not smtp_host or not smtp_user or not smtp_password:
            logger.warning('[email_utils] Configurações SMTP incompletas — e-mail não enviado.')
            return False

        msg = MIMEMultipart('mixed')
        msg['Subject'] = assunto
        msg['From'] = f'{from_name} <{from_email}>'
        msg['To'] = destinatario

        # Corpo HTML
        parte_html = MIMEText(corpo_html, 'html', 'utf-8')
        msg.attach(parte_html)

        # Anexo PDF
        parte_pdf = MIMEApplication(anexo_bytes, _subtype='pdf')
        parte_pdf.add_header('Content-Disposition', 'attachment', filename=nome_arquivo)
        msg.attach(parte_pdf)

        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as servidor:
            servidor.ehlo()
            if use_tls:
                servidor.starttls()
                servidor.ehlo()
            servidor.login(smtp_user, smtp_password)
            servidor.sendmail(from_email, [destinatario], msg.as_bytes())

        logger.info('[email_utils] E-mail enviado para %s — assunto: %s', destinatario, assunto)
        return True

    except Exception as exc:  # noqa: BLE001
        logger.error('[email_utils] Falha ao enviar e-mail para %s: %s', destinatario, exc)
        return False
