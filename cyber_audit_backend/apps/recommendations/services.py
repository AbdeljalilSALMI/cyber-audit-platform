"""
Génération automatique des recommandations (section 14).

generate_recommendations_for_audit(audit) parcourt les risques de l'audit
et, pour chaque risque issu d'un RiskTemplate ayant des
RecommendationTemplate associés, crée (ou met à jour) les Recommendation
correspondantes.
"""

from apps.recommendations.models import Recommendation
from apps.risks.models import RiskTemplate


def generate_recommendations_for_audit(audit):
    created_or_updated = []

    risks = audit.risks.select_related("source_answer__question", "source_answer__answer_choice")

    for risk in risks:
        if not risk.source_answer_id:
            continue

        matching_templates = RiskTemplate.objects.filter(
            question=risk.source_answer.question,
            trigger_choice=risk.source_answer.answer_choice,
        )

        for risk_template in matching_templates:
            for reco_template in risk_template.recommendation_templates.all():
                recommendation, _ = Recommendation.objects.update_or_create(
                    risk=risk,
                    title=reco_template.title,
                    defaults={
                        "description": reco_template.description,
                        "priority": reco_template.priority,
                        "estimated_effort": reco_template.estimated_effort,
                    },
                )
                created_or_updated.append(recommendation)

    return created_or_updated
