from rest_framework import serializers

from .models import Risk, RiskTemplate


class RiskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Risk
        fields = [
            "id", "audit", "category", "source_answer", "name", "description",
            "probability", "impact", "risk_score", "severity", "status",
            "identified_at", "updated_at",
        ]
        read_only_fields = ["risk_score", "severity", "identified_at", "updated_at"]


class RiskTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskTemplate
        fields = [
            "id", "question", "trigger_choice", "risk_name", "risk_description",
            "default_probability", "default_impact",
        ]
