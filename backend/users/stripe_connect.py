"""
Stripe Connect onboarding for sellers.
Full OAuth flow: create account → onboarding link → webhook confirmation
"""
import stripe
from django.conf import settings
from django.shortcuts import redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

stripe.api_key = settings.STRIPE_SECRET_KEY


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_connect_account(request):
    """Step 1: Create a Stripe Connect account for the seller."""
    user = request.user

    try:
        profile = user.profile
    except Exception:
        return Response({'error': 'Profile not found.'}, status=400)

    if profile.user_type != 'seller':
        return Response({'error': 'Only sellers can connect a Stripe account.'}, status=403)

    # If already connected, return status
    if profile.stripe_account_id:
        account = stripe.Account.retrieve(profile.stripe_account_id)
        return Response({
            'already_connected': True,
            'charges_enabled': account.charges_enabled,
            'payouts_enabled': account.payouts_enabled,
            'stripe_account_id': profile.stripe_account_id,
        })

    # Create Express account
    account = stripe.Account.create(
        type='express',
        country=request.data.get('country', 'US'),
        email=user.email,
        capabilities={
            'card_payments': {'requested': True},
            'transfers': {'requested': True},
        },
        business_profile={
            'name': user.get_full_name() or user.username,
            'url': settings.FRONTEND_URL,
        },
        metadata={'user_id': str(user.id), 'username': user.username},
    )

    # Save account ID
    profile.stripe_account_id = account.id
    profile.save(update_fields=['stripe_account_id'])

    return Response({
        'account_id': account.id,
        'message': 'Stripe Connect account created. Proceed to onboarding.',
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_onboarding_link(request):
    """Step 2: Generate onboarding link to send seller to Stripe."""
    user = request.user
    profile = user.profile

    if not profile.stripe_account_id:
        return Response({'error': 'Create a Connect account first.'}, status=400)

    account_link = stripe.AccountLink.create(
        account=profile.stripe_account_id,
        refresh_url=f"{settings.FRONTEND_URL}/dashboard/stripe/refresh",
        return_url=f"{settings.FRONTEND_URL}/dashboard/stripe/return",
        type='account_onboarding',
    )

    return Response({'onboarding_url': account_link.url})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def connect_status(request):
    """Check the seller's Stripe Connect status."""
    user = request.user
    profile = user.profile

    if not profile.stripe_account_id:
        return Response({
            'connected': False,
            'stripe_account_id': None,
            'charges_enabled': False,
            'payouts_enabled': False,
            'details_submitted': False,
        })

    try:
        account = stripe.Account.retrieve(profile.stripe_account_id)
        return Response({
            'connected': True,
            'stripe_account_id': profile.stripe_account_id,
            'charges_enabled': account.charges_enabled,
            'payouts_enabled': account.payouts_enabled,
            'details_submitted': account.details_submitted,
            'requirements': {
                'currently_due': account.requirements.currently_due,
                'eventually_due': account.requirements.eventually_due,
                'disabled_reason': account.requirements.disabled_reason,
            },
            'dashboard_url': f"https://dashboard.stripe.com/connect/accounts/{profile.stripe_account_id}",
        })
    except stripe.error.PermissionError:
        # Account was deleted or deauthorized
        profile.stripe_account_id = None
        profile.save(update_fields=['stripe_account_id'])
        return Response({'connected': False, 'stripe_account_id': None, 'charges_enabled': False})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disconnect_account(request):
    """Disconnect seller's Stripe account."""
    user = request.user
    profile = user.profile

    if not profile.stripe_account_id:
        return Response({'error': 'No account connected.'}, status=400)

    try:
        stripe.oauth.deauthorize(client_id=settings.STRIPE_CLIENT_ID, stripe_user_id=profile.stripe_account_id)
    except Exception:
        pass  # May already be disconnected

    profile.stripe_account_id = None
    profile.save(update_fields=['stripe_account_id'])
    return Response({'message': 'Stripe account disconnected.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_login_link(request):
    """Generate a link to the seller's Stripe Express dashboard."""
    user = request.user
    profile = user.profile

    if not profile.stripe_account_id:
        return Response({'error': 'No account connected.'}, status=400)

    link = stripe.Account.create_login_link(profile.stripe_account_id)
    return Response({'url': link.url})
