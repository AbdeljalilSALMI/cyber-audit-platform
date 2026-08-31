from rest_framework import permissions, viewsets

from apps.accounts.permissions import IsAuditorOrAdmin, OrganizationScopedQuerysetMixin

from .models import Recommendation, RecommendationTemplate
from .serializers import RecommendationSerializer, RecommendationTemplateSerializer


class RecommendationViewSet(OrganizationScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Recommendation.objects.select_related("risk")
    serializer_class = RecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["risk", "priority", "is_validated"]
    org_lookup = "risk__audit__organization"


class RecommendationTemplateViewSet(viewsets.ModelViewSet):
    queryset = RecommendationTemplate.objects.select_related("risk_template")
    serializer_class = RecommendationTemplateSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAuditorOrAdmin()]
