from rest_framework import serializers

from .models import Recommendation, RecommendationTemplate


class RecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recommendation
        fields = [
            "id", "risk", "title", "description", "priority",
            "estimated_effort", "is_validated", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class RecommendationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecommendationTemplate
        fields = ["id", "risk_template", "title", "description", "priority", "estimated_effort"]
