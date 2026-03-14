from django.apps import AppConfig

class DashboardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'dashboard'

    def ready(self):
        # Register all models with our custom admin site
        from dashboard.admin_site import local_market_admin
        from django.contrib.auth.models import User, Group
        from django.contrib.auth.admin import UserAdmin, GroupAdmin

        # Re-register core auth models
        local_market_admin.register(User, UserAdmin)
        local_market_admin.register(Group, GroupAdmin)
