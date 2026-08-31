from rest_framework import permissions, viewsets

from apps.accounts.permissions import IsPlatformAdmin, OrganizationScopedQuerysetMixin

from .models import MaturityLevel, Score
from .serializers import MaturityLevelSerializer, ScoreSerializer


class ScoreViewSet(OrganizationScopedQuerysetMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Score.objects.select_related("audit", "category")
    serializer_class = ScoreSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["audit", "category"]
    org_lookup = "audit__organization"


class MaturityLevelViewSet(viewsets.ModelViewSet):
    queryset = MaturityLevel.objects.all()
    serializer_class = MaturityLevelSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsPlatformAdmin()]
