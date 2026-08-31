from rest_framework.routers import DefaultRouter

from .views import (
    AnswerChoiceViewSet,
    CategoryViewSet,
    FrameworkViewSet,
    QuestionConditionViewSet,
    QuestionViewSet,
)

router = DefaultRouter()
router.register("frameworks", FrameworkViewSet, basename="framework")
router.register("categories", CategoryViewSet, basename="category")
router.register("questions", QuestionViewSet, basename="question")
router.register("answer-choices", AnswerChoiceViewSet, basename="answer-choice")
router.register("question-conditions", QuestionConditionViewSet, basename="question-condition")

urlpatterns = router.urls
