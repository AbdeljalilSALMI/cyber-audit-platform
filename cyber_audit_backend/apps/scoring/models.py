from django.db import models


class MaturityLevel(models.Model):
    

    name = models.CharField(max_length=100, unique=True)
    min_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    max_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]
        verbose_name = "Niveau de maturité"
        verbose_name_plural = "Niveaux de maturité"

    def __str__(self):
        return f"{self.name} ({self.min_percentage}–{self.max_percentage}%)"

    @classmethod
    def for_percentage(cls, percentage):
        """Retourne le MaturityLevel correspondant à un pourcentage donné, ou None."""
        return cls.objects.filter(
            min_percentage__lte=percentage, max_percentage__gte=percentage
        ).first()


class Score(models.Model):
    """
    Score calculé pour un audit, soit par catégorie (category renseignée),
    soit global (category=None). Recalculé par compute_audit_score() dans
    services.py à chaque fois que l'audit est (re)évalué.
    """

    audit = models.ForeignKey(
        "audits.Audit", on_delete=models.CASCADE, related_name="scores"
    )
    category = models.ForeignKey(
        "questionnaires.Category",
        on_delete=models.CASCADE,
        related_name="scores",
        null=True,
        blank=True,
        help_text="Laisser vide pour le score global de l'audit.",
    )
    raw_points = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    max_points = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["audit", "category__order"]
        verbose_name = "Score"
        verbose_name_plural = "Scores"

    def __str__(self):
        label = self.category.name if self.category else "Score global"
        return f"{self.audit} — {label} : {self.percentage}%"
