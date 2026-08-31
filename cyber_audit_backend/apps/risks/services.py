"""
Génération automatique des risques (section 13).

generate_risks_for_audit(audit) parcourt les réponses de l'audit et,
pour chaque réponse dont le choix correspond à un RiskTemplate déclenché,
crée (ou met à jour) le Risk correspondant.
"""

from apps.risks.models import Risk, RiskTemplate


def generate_risks_for_audit(audit):
    created_or_updated = []

    answers = audit.answers.select_related("question__category", "answer_choice")

    for answer in answers:
        if not answer.answer_choice_id:
            continue

        templates = RiskTemplate.objects.filter(
            question=answer.question, trigger_choice=answer.answer_choice
        )

        for template in templates:
            risk, _ = Risk.objects.update_or_create(
                audit=audit,
                source_answer=answer,
                defaults={
                    "category": answer.question.category,
                    "name": template.risk_name,
                    "description": template.risk_description,
                    "probability": template.default_probability,
                    "impact": template.default_impact,
                },
            )
            created_or_updated.append(risk)

    return created_or_updated
