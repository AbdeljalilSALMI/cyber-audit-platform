from rest_framework.routers import DefaultRouter

from .views import AnswerViewSet, AuditViewSet

router = DefaultRouter()
router.register("answers", AnswerViewSet, basename="answer")
router.register("", AuditViewSet, basename="audit")

urlpatterns = router.urls
