from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Profile


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'
    extra = 0
    fields = ('user_type', 'phone', 'city', 'country', 'bio', 'is_verified', 'stripe_account_id')


class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)
    list_display = ('username', 'email', 'get_user_type', 'get_verified', 'is_staff', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'profile__user_type', 'profile__is_verified')
    search_fields = ('username', 'email', 'profile__phone')

    def get_user_type(self, obj):
        try:
            return obj.profile.user_type.capitalize()
        except:
            return '-'
    get_user_type.short_description = 'Type'

    def get_verified(self, obj):
        try:
            return obj.profile.is_verified
        except:
            return False
    get_verified.short_description = 'Verified'
    get_verified.boolean = True


admin.site.unregister(User)
admin.site.register(User, UserAdmin)

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_type', 'city', 'country', 'is_verified', 'created_at')
    list_filter = ('user_type', 'is_verified', 'country')
    search_fields = ('user__username', 'user__email', 'phone')
    list_editable = ('is_verified',)
