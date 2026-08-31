from rest_framework import serializers

from .models import Answer, Audit


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = [
            "id", "audit", "question", "answer_choice", "comment", "evidence",
            "computed_score", "created_at", "updated_at",
        ]
        read_only_fields = ["computed_score", "created_at", "updated_at"]


class AuditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Audit
        fields = [
            "id", "organization", "framework", "auditor", "status",
            "start_date", "end_date", "overall_score", "maturity_level_label",
            "created_at", "updated_at",
        ]
        read_only_fields = ["overall_score", "maturity_level_label", "created_at", "updated_at"]


class AuditDetailSerializer(AuditSerializer):
    answers = AnswerSerializer(many=True, read_only=True)

    class Meta(AuditSerializer.Meta):
        fields = AuditSerializer.Meta.fields + ["answers"]
