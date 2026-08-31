from rest_framework import serializers

from .models import AnswerChoice, Category, Framework, Question, QuestionCondition


class AnswerChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerChoice
        fields = ["id", "question", "label", "percentage", "order"]


class QuestionSerializer(serializers.ModelSerializer):
    choices = AnswerChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = [
            "id", "category", "question_text", "description", "question_type",
            "weight", "required", "order", "active", "choices",
        ]


class CategorySerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ["id", "framework", "name", "description", "weight", "order", "questions"]


class FrameworkSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)

    class Meta:
        model = Framework
        fields = ["id", "name", "description", "is_active", "created_at", "categories"]
        read_only_fields = ["created_at"]


class FrameworkListSerializer(serializers.ModelSerializer):
    """Version légère (sans l'arborescence complète) pour les listes."""

    class Meta:
        model = Framework
        fields = ["id", "name", "description", "is_active"]


class QuestionConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionCondition
        fields = ["id", "question", "depends_on_question", "required_choice"]
