from rest_framework.routers import DefaultRouter

from .views import MaturityLevelViewSet, ScoreViewSet

router = DefaultRouter()
router.register("scores", ScoreViewSet, basename="score")
router.register("maturity-levels", MaturityLevelViewSet, basename="maturity-level")

urlpatterns = router.urls
