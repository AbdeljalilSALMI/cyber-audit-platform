from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.audit_log import log_action
from apps.accounts.permissions import OrganizationScopedQuerysetMixin
from apps.action_plans.services import generate_action_plan_for_audit
from apps.notifications.services import notify_audit_completed
from apps.recommendations.services import generate_recommendations_for_audit
from apps.risks.services import generate_risks_for_audit
from apps.scoring.services import compute_audit_score

from .models import Answer, Audit
from .serializers import AnswerSerializer, AuditDetailSerializer, AuditSerializer


class AuditViewSet(OrganizationScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Audit.objects.select_related("organization", "framework", "auditor")
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["organization", "framework", "status"]
    org_lookup = "organization"

    def get_serializer_class(self):
        return AuditDetailSerializer if self.action == "retrieve" else AuditSerializer

    @action(detail=True, methods=["post"], url_path="answers")
    def submit_answer(self, request, pk=None):
        """
        POST /api/audits/{id}/answers/ { question, answer_choice, comment? }
        Crée ou met à jour la réponse (une seule par question et par audit).
        """
        audit = self.get_object()
        data = request.data.copy()
        data["audit"] = audit.id

        existing = Answer.objects.filter(audit=audit, question_id=data.get("question")).first()
        serializer = AnswerSerializer(instance=existing, data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        http_status = status.HTTP_200_OK if existing else status.HTTP_201_CREATED
        return Response(serializer.data, status=http_status)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """
        POST /api/audits/{id}/complete/
        Termine l'audit et déclenche en cascade : scoring → risques →
        recommandations → plan d'action (le même enchaînement que les
        actions admin des Phases 7 à 10, mais en un seul appel API).
        """
        audit = self.get_object()
        audit.status = Audit.Status.COMPLETED
        audit.save(update_fields=["status", "updated_at"])

        compute_audit_score(audit)
        generate_risks_for_audit(audit)
        generate_recommendations_for_audit(audit)
        generate_action_plan_for_audit(audit)
        notify_audit_completed(audit)

        audit.refresh_from_db()
        log_action(request, action="AUDIT_COMPLETE", resource=f"Audit#{audit.id}")
        return Response(AuditDetailSerializer(audit).data)


class AnswerViewSet(OrganizationScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Answer.objects.select_related("audit", "question", "answer_choice")
    serializer_class = AnswerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["audit", "question"]
    org_lookup = "audit__organization"
