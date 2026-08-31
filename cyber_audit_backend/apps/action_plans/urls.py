from rest_framework.routers import DefaultRouter

from .views import ActionViewSet

router = DefaultRouter()
router.register("", ActionViewSet, basename="action")

urlpatterns = router.urls
