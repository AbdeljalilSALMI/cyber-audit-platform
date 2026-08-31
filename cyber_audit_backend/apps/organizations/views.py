from rest_framework import permissions, viewsets

from .models import Organization
from .serializers import OrganizationSerializer


class OrganizationViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["company_size", "country"]
    search_fields = ["name", "city", "sector"]

    def get_queryset(self):
        user = self.request.user
        qs = Organization.objects.all()
        if user.is_platform_admin or user.is_auditor:
            return qs
        if user.organization_id:
            return qs.filter(id=user.organization_id)
        return qs.none()
