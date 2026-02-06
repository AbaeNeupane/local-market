import stripe
from django.conf import settings
from django.shortcuts import render, redirect
from products.models import Product
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
import json

stripe.api_key = settings.STRIPE_SECRET_KEY

def create_checkout_session(request, product_id):
    product = Product.objects.get(id=product_id)
    seller_account_id = product.seller.profile.stripe_account_id

    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=[{
            'price_data': {
                'currency': 'usd',
                'product_data': {'name': product.name},
                'unit_amount': int(product.price * 100),
            },
            'quantity': 1,
        }],
        mode='payment',
        success_url='http://localhost:8000/payments/success/',
        cancel_url='http://localhost:8000/payments/cancel/',
        payment_intent_data={
            "application_fee_amount": int(product.price * 100 * 0.10),
            "transfer_data": {"destination": seller_account_id},
        },
    )
    return render(request, 'payments/checkout.html', {
        'session_id': session.id,
        'stripe_public_key': settings.STRIPE_PUBLIC_KEY
    })

def success(request):
    return render(request, 'payments/success.html')

def cancel(request):
    return render(request, 'payments/cancel.html')

@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    event = None
    try:
        event = json.loads(payload)
    except Exception as e:
        return HttpResponse(status=400)

    if event['type'] == 'checkout.session.completed':
        print("Payment successful")
    return HttpResponse(status=200)
