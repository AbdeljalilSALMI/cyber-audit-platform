from rest_framework import permissions, viewsets

from apps.accounts.permissions import IsAuditorOrAdmin, OrganizationScopedQuerysetMixin

from .models import Risk, RiskTemplate
from .serializers import RiskSerializer, RiskTemplateSerializer


class RiskViewSet(OrganizationScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Risk.objects.select_related("audit", "category", "source_answer")
    serializer_class = RiskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["audit", "category", "severity", "status"]
    org_lookup = "audit__organization"


class RiskTemplateViewSet(viewsets.ModelViewSet):
    queryset = RiskTemplate.objects.select_related("question", "trigger_choice")
    serializer_class = RiskTemplateSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAuditorOrAdmin()]
