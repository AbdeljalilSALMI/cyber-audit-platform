from rest_framework import serializers

from .models import Action


class ActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Action
        fields = [
            "id", "recommendation", "title", "description", "priority",
            "estimated_effort", "responsible_user", "due_date", "status",
            "created_at", "completed_at",
        ]
        read_only_fields = ["created_at", "completed_at"]
