from rest_framework.routers import DefaultRouter

from .views import RiskTemplateViewSet, RiskViewSet

router = DefaultRouter()
router.register("templates", RiskTemplateViewSet, basename="risk-template")
router.register("", RiskViewSet, basename="risk")

urlpatterns = router.urls
