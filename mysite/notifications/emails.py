"""
Email notification service for Local Market.
Sends HTML emails for all key events.
"""
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)


def send_email(subject, template_name, context, to_email):
    """Generic email sender with HTML + plaintext fallback."""
    try:
        html_content = render_to_string(f'notifications/emails/{template_name}.html', context)
        text_content = strip_tags(html_content)
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
        )
        email.attach_alternative(html_content, 'text/html')
        email.send()
        logger.info(f"Email sent: {subject} → {to_email}")
        return True
    except Exception as e:
        logger.error(f"Email failed: {subject} → {to_email}: {e}")
        return False


def send_order_confirmation(order):
    """Send order confirmation to buyer."""
    send_email(
        subject=f"Order #{order.id} Confirmed — Local Market",
        template_name='order_confirmation',
        context={
            'order': order,
            'buyer': order.buyer,
            'product': order.product,
            'frontend_url': settings.FRONTEND_URL,
        },
        to_email=order.buyer.email,
    )


def send_new_sale_notification(order):
    """Notify seller of a new sale."""
    send_email(
        subject=f"🎉 You made a sale! Order #{order.id} — Local Market",
        template_name='new_sale',
        context={
            'order': order,
            'seller': order.product.seller,
            'product': order.product,
            'frontend_url': settings.FRONTEND_URL,
        },
        to_email=order.product.seller.email,
    )


def send_order_status_update(order, old_status):
    """Notify buyer when their order status changes."""
    send_email(
        subject=f"Order #{order.id} Update: {order.get_status_display()} — Local Market",
        template_name='order_status_update',
        context={
            'order': order,
            'buyer': order.buyer,
            'old_status': old_status,
            'new_status': order.get_status_display(),
            'frontend_url': settings.FRONTEND_URL,
        },
        to_email=order.buyer.email,
    )


def send_welcome_email(user):
    """Welcome email after registration."""
    send_email(
        subject="Welcome to Local Market! 🛍️",
        template_name='welcome',
        context={
            'user': user,
            'frontend_url': settings.FRONTEND_URL,
        },
        to_email=user.email,
    )


def send_stripe_onboard_complete(user):
    """Notify seller that Stripe onboarding is complete."""
    send_email(
        subject="Your seller account is ready! — Local Market",
        template_name='stripe_onboard_complete',
        context={
            'user': user,
            'frontend_url': settings.FRONTEND_URL,
        },
        to_email=user.email,
    )
