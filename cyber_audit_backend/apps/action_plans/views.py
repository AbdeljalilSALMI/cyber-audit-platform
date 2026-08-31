from rest_framework import permissions, viewsets

from apps.accounts.permissions import OrganizationScopedQuerysetMixin

from .models import Action
from .serializers import ActionSerializer


class ActionViewSet(OrganizationScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Action.objects.select_related("recommendation", "responsible_user")
    serializer_class = ActionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["recommendation", "status", "priority", "responsible_user"]
    org_lookup = "recommendation__risk__audit__organization"
