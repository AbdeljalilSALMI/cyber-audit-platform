from rest_framework import serializers

from .models import MaturityLevel, Score


class ScoreSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)

    class Meta:
        model = Score
        fields = [
            "id", "audit", "category", "category_name",
            "raw_points", "max_points", "percentage", "computed_at",
        ]


class MaturityLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaturityLevel
        fields = ["id", "name", "min_percentage", "max_percentage", "description", "order"]
