"""
Email notification service for all marketplace events.
Uses Django's built-in email system — configure SMTP in settings.
"""
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings


def _send(subject, to_email, template_name, context):
    """Internal helper: render template and send HTML email."""
    try:
        html = render_to_string(f'notifications/{template_name}', context)
        text = render_to_string(f'notifications/{template_name.replace(".html", "_plain.html")}', context)
    except Exception:
        # Fallback plain text if template missing
        text = subject
        html = f'<p>{subject}</p>'

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
    )
    msg.attach_alternative(html, 'text/html')
    msg.send(fail_silently=True)


def notify_order_placed(order):
    """Notify buyer (confirmation) and seller (new sale) when order is placed."""
    # ── Buyer confirmation ──────────────────────────────────────
    _send(
        subject=f'✅ Order Confirmed — #{order.id} | Local Market',
        to_email=order.buyer.email,
        template_name='order_confirmation.html',
        context={
            'user': order.buyer,
            'order': order,
            'product': order.product,
            'frontend_url': settings.FRONTEND_URL,
        }
    )

    # ── Seller new sale alert ────────────────────────────────────
    seller = order.product.seller
    _send(
        subject=f'🛍️ New Sale — {order.product.name} | Local Market',
        to_email=seller.email,
        template_name='new_sale_alert.html',
        context={
            'seller': seller,
            'order': order,
            'product': order.product,
            'buyer': order.buyer,
            'frontend_url': settings.FRONTEND_URL,
        }
    )


def notify_order_status_change(order, old_status, new_status):
    """Notify buyer when seller updates order status."""
    status_messages = {
        'confirmed':        ('📋 Order Confirmed',        'Your order has been confirmed by the seller.'),
        'processing':       ('⚙️ Order Being Processed',  'The seller is processing your order.'),
        'packed':           ('📦 Order Packed',           'Your order has been packed and is ready to ship.'),
        'shipped':          ('🚚 Order Shipped!',         'Your order is on its way!'),
        'out_for_delivery': ('🏠 Out for Delivery',       'Your order will arrive today!'),
        'delivered':        ('✅ Order Delivered',        'Your order has been delivered. Enjoy!'),
        'cancelled':        ('❌ Order Cancelled',        'Your order has been cancelled.'),
        'refunded':         ('💰 Refund Processed',       'Your refund has been processed.'),
    }
    subject_prefix, status_message = status_messages.get(new_status, (f'Order Update', f'Your order status changed to {new_status}.'))

    _send(
        subject=f'{subject_prefix} — Order #{order.id} | Local Market',
        to_email=order.buyer.email,
        template_name='order_status_update.html',
        context={
            'user': order.buyer,
            'order': order,
            'product': order.product,
            'old_status': old_status,
            'new_status': new_status,
            'status_message': status_message,
            'frontend_url': settings.FRONTEND_URL,
        }
    )


def notify_payment_failed(order):
    """Notify buyer when a payment fails."""
    _send(
        subject=f'⚠️ Payment Failed — Order #{order.id} | Local Market',
        to_email=order.buyer.email,
        template_name='payment_failed.html',
        context={
            'user': order.buyer,
            'order': order,
            'product': order.product,
            'frontend_url': settings.FRONTEND_URL,
        }
    )


def notify_seller_stripe_connected(seller):
    """Notify seller when Stripe Connect is successfully set up."""
    _send(
        subject='🎉 Stripe Account Connected — Start Receiving Payments!',
        to_email=seller.email,
        template_name='stripe_connected.html',
        context={
            'seller': seller,
            'frontend_url': settings.FRONTEND_URL,
        }
    )


def notify_welcome(user):
    """Welcome email on registration."""
    _send(
        subject='👋 Welcome to Local Market!',
        to_email=user.email,
        template_name='welcome.html',
        context={
            'user': user,
            'user_type': user.profile.user_type,
            'frontend_url': settings.FRONTEND_URL,
        }
    )
