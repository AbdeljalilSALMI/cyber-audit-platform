"""
Génération automatique du plan d'action (section 15).

generate_action_plan_for_audit(audit) crée une Action pour chaque
Recommendation de l'audit qui n'en a pas encore (get_or_create sur la
recommandation — ne duplique pas si la fonction est rappelée).
"""

from apps.action_plans.models import Action
from apps.recommendations.models import Recommendation


def generate_action_plan_for_audit(audit):
    created = []

    recommendations = Recommendation.objects.filter(risk__audit=audit)

    for recommendation in recommendations:
        action, was_created = Action.objects.get_or_create(
            recommendation=recommendation,
            defaults={
                "title": recommendation.title,
                "description": recommendation.description,
                "priority": recommendation.priority,
                "estimated_effort": recommendation.estimated_effort,
            },
        )
        if was_created:
            created.append(action)

    return created
