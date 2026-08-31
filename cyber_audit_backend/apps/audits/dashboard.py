from datetime import date

from django.db.models import Avg
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.action_plans.models import Action
from apps.recommendations.models import Recommendation
from apps.organizations.models import Organization
from apps.risks.models import Risk

from .models import Audit


class OverviewDashboardView(APIView):
    """
    GET /api/dashboard/overview/

    Vue d'ensemble agrégée, réservée aux rôles ADMIN/AUDITOR : statistiques
    sur l'ensemble des organisations, plus un résumé par organisation pour
    permettre de zoomer sur l'une d'elles (voir DashboardView ensuite).
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not (user.is_platform_admin or user.is_auditor):
            return Response(
                {"detail": "Réservé aux rôles ADMIN et AUDITOR."}, status=403
            )

        organizations = Organization.objects.all()
        audits = Audit.objects.all()
        completed_audits = audits.filter(status=Audit.Status.COMPLETED)

        average_score = completed_audits.aggregate(avg=Avg("overall_score"))["avg"]

        critical_risks_count = Risk.objects.filter(
            audit__in=completed_audits, severity="CRITICAL"
        ).count()
        high_risks_count = Risk.objects.filter(
            audit__in=completed_audits, severity="HIGH"
        ).count()

        overdue_actions_count = Action.objects.filter(
            due_date__lt=date.today()
        ).exclude(status=Action.Status.COMPLETED).count()

        org_summaries = []
        for org in organizations:
            last_audit = audits.filter(organization=org).order_by("-created_at").first()
            org_summaries.append(
                {
                    "id": org.id,
                    "name": org.name,
                    "last_audit_id": last_audit.id if last_audit else None,
                    "last_audit_score": last_audit.overall_score if last_audit else None,
                    "last_audit_maturity": last_audit.maturity_level_label if last_audit else "",
                    "last_audit_status": last_audit.status if last_audit else None,
                    "last_audit_date": last_audit.created_at if last_audit else None,
                }
            )

        return Response(
            {
                "organizations_count": organizations.count(),
                "audits_count": audits.count(),
                "completed_audits_count": completed_audits.count(),
                "average_score": round(average_score, 1) if average_score is not None else None,
                "critical_risks_count": critical_risks_count,
                "high_risks_count": high_risks_count,
                "overdue_actions_count": overdue_actions_count,
                "organizations": org_summaries,
            }
        )


class DashboardView(APIView):
    """
    GET /api/dashboard/?organization=<id>

    Retourne les données agrégées pour le tableau de bord (section 17) à
    partir du dernier audit de l'organisation : score global, niveau de
    maturité, score par domaine, risques critiques/élevés, recommandations
    prioritaires, actions en retard/terminées, évolution du score.

    Les rôles COMPANY_ADMIN/COMPANY_USER sont automatiquement limités à
    leur propre organisation ; ADMIN/AUDITOR peuvent préciser ?organization=.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        audits = Audit.objects.all()

        if user.is_platform_admin or user.is_auditor:
            organization_id = request.query_params.get("organization")
            if organization_id:
                audits = audits.filter(organization_id=organization_id)
        else:
            if not user.organization_id:
                return Response({"detail": "Aucune organisation associée à cet utilisateur."}, status=400)
            audits = audits.filter(organization_id=user.organization_id)

        last_audit = audits.order_by("-created_at").first()
        if not last_audit:
            return Response({"detail": "Aucun audit trouvé."}, status=404)

        scores_by_category = list(
            last_audit.scores.filter(category__isnull=False)
            .select_related("category")
            .values("category__name", "percentage")
        )

        priority_recommendations = list(
            Recommendation.objects.filter(risk__audit=last_audit, priority="HIGH")
            .values("id", "title", "priority")[:10]
        )

        actions_qs = Action.objects.filter(recommendation__risk__audit=last_audit)
        overdue_actions_count = actions_qs.filter(
            due_date__lt=date.today()
        ).exclude(status=Action.Status.COMPLETED).count()
        completed_actions_count = actions_qs.filter(status=Action.Status.COMPLETED).count()

        score_evolution = list(
            audits.exclude(overall_score__isnull=True)
            .order_by("created_at")
            .values("id", "created_at", "overall_score")
        )

        return Response(
            {
                "last_audit": {
                    "id": last_audit.id,
                    "organization": last_audit.organization.name,
                    "overall_score": last_audit.overall_score,
                    "maturity_level": last_audit.maturity_level_label,
                    "status": last_audit.status,
                },
                "scores_by_category": scores_by_category,
                "critical_risks_count": last_audit.risks.filter(severity="CRITICAL").count(),
                "high_risks_count": last_audit.risks.filter(severity="HIGH").count(),
                "priority_recommendations": priority_recommendations,
                "overdue_actions_count": overdue_actions_count,
                "completed_actions_count": completed_actions_count,
                "score_evolution": score_evolution,
            }
        )
