from rest_framework import viewsets

from apps.accounts.permissions import ReadOnlyOrAuditorAdmin

from .models import AnswerChoice, Category, Framework, Question, QuestionCondition
from .serializers import (
    QuestionConditionSerializer,
    AnswerChoiceSerializer,
    CategorySerializer,
    FrameworkListSerializer,
    FrameworkSerializer,
    QuestionSerializer,
)


class FrameworkViewSet(viewsets.ModelViewSet):
    queryset = Framework.objects.all().prefetch_related("categories__questions__choices")
    permission_classes = [ReadOnlyOrAuditorAdmin]

    def get_serializer_class(self):
        return FrameworkSerializer if self.action == "retrieve" else FrameworkListSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().select_related("framework")
    serializer_class = CategorySerializer
    permission_classes = [ReadOnlyOrAuditorAdmin]
    filterset_fields = ["framework"]


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all().select_related("category").prefetch_related("choices")
    serializer_class = QuestionSerializer
    permission_classes = [ReadOnlyOrAuditorAdmin]
    filterset_fields = ["category", "category__framework", "active"]


class AnswerChoiceViewSet(viewsets.ModelViewSet):
    queryset = AnswerChoice.objects.all()
    serializer_class = AnswerChoiceSerializer
    permission_classes = [ReadOnlyOrAuditorAdmin]
    filterset_fields = ["question"]


class QuestionConditionViewSet(viewsets.ModelViewSet):
    queryset = QuestionCondition.objects.select_related(
        "question", "depends_on_question", "required_choice"
    )
    serializer_class = QuestionConditionSerializer
    permission_classes = [ReadOnlyOrAuditorAdmin]
    filterset_fields = ["question", "depends_on_question"]
