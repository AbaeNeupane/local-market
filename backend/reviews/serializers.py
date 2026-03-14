from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.username', read_only=True)
    reviewer_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'reviewer_name', 'reviewer_avatar', 'rating', 'title', 'body', 'created_at']
        read_only_fields = ['reviewer_name', 'reviewer_avatar', 'created_at']

    def get_reviewer_avatar(self, obj):
        try:
            if obj.reviewer.profile.avatar:
                request = self.context.get('request')
                return request.build_absolute_uri(obj.reviewer.profile.avatar.url) if request else None
        except:
            pass
        return None

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value