from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.audit_log import log_action
from apps.accounts.permissions import OrganizationScopedQuerysetMixin
from apps.audits.models import Audit

from .models import Report
from .serializers import ReportSerializer
from .services import generate_report_for_audit


class ReportViewSet(OrganizationScopedQuerysetMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Report.objects.select_related("audit", "generated_by")
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["audit"]
    org_lookup = "audit__organization"

    @action(detail=False, methods=["post"])
    def generate(self, request):
        """POST /api/reports/generate/ { audit: <id> } — génère un nouveau rapport PDF."""
        audit_id = request.data.get("audit")
        audit = Audit.objects.filter(pk=audit_id).select_related("organization").first()
        if not audit:
            return Response({"detail": "Audit introuvable."}, status=404)

        user = request.user
        if not (user.is_platform_admin or user.is_auditor):
            if audit.organization_id != user.organization_id:
                return Response({"detail": "Non autorisé."}, status=403)

        report = generate_report_for_audit(audit, generated_by=user)
        log_action(request, action="REPORT_GENERATE", resource=f"Audit#{audit.id}")
        return Response(
            ReportSerializer(report, context={"request": request}).data, status=201
        )
