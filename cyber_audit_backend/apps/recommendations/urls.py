from rest_framework.routers import DefaultRouter

from .views import RecommendationTemplateViewSet, RecommendationViewSet

router = DefaultRouter()
router.register("templates", RecommendationTemplateViewSet, basename="recommendation-template")
router.register("", RecommendationViewSet, basename="recommendation")

urlpatterns = router.urls
