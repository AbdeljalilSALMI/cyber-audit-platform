"""
Moteur de scoring (section 11 du prompt).

compute_audit_score(audit) recalcule :
  - un Score par catégorie : raw_points / max_points × 100
  - un Score global (category=None) : Σ raw_points / Σ max_points × 100
    (mathématiquement équivalent à Σ(Category Score × Category Weight) /
    Σ Category Weight, voir la note dans questionnaires/models.py)

et met à jour les champs cache Audit.overall_score et
Audit.maturity_level_label.

Ne recalcule PAS Answer.computed_score : ce calcul est déjà fait dans
Answer.save() (Phase 6). Cette fonction ne fait qu'agréger des valeurs
déjà calculées.
"""

from decimal import Decimal

from django.db.models import Sum

from apps.scoring.models import MaturityLevel, Score


def compute_audit_score(audit):
    """Recalcule et persiste tous les Score (par catégorie + global) d'un audit."""

    categories = {
        answer.question.category
        for answer in audit.answers.select_related("question__category")
    }

    total_raw = Decimal("0")
    total_max = Decimal("0")

    for category in categories:
        answers = audit.answers.filter(question__category=category)
        raw_points = answers.aggregate(total=Sum("computed_score"))["total"] or Decimal("0")
        max_points = Decimal(category.weight)
        percentage = (raw_points / max_points * 100) if max_points else Decimal("0")

        Score.objects.update_or_create(
            audit=audit,
            category=category,
            defaults={
                "raw_points": raw_points,
                "max_points": max_points,
                "percentage": round(percentage, 2),
            },
        )

        total_raw += raw_points
        total_max += max_points

    global_percentage = (total_raw / total_max * 100) if total_max else Decimal("0")
    global_percentage = round(global_percentage, 2)

    global_score, _ = Score.objects.update_or_create(
        audit=audit,
        category=None,
        defaults={
            "raw_points": total_raw,
            "max_points": total_max,
            "percentage": global_percentage,
        },
    )

    maturity_level = MaturityLevel.for_percentage(global_percentage)

    audit.overall_score = global_percentage
    audit.maturity_level_label = maturity_level.name if maturity_level else ""
    audit.save(update_fields=["overall_score", "maturity_level_label", "updated_at"])

    return global_score
