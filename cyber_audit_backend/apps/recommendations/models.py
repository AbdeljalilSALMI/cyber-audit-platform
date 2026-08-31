from django.db import models


class Recommendation(models.Model):
    class Priority(models.TextChoices):
        LOW = "LOW", "Faible"
        MEDIUM = "MEDIUM", "Moyenne"
        HIGH = "HIGH", "Haute"

    class Effort(models.TextChoices):
        LOW = "LOW", "Faible"
        MEDIUM = "MEDIUM", "Moyen"
        HIGH = "HIGH", "Élevé"

    risk = models.ForeignKey(
        "risks.Risk", on_delete=models.CASCADE, related_name="recommendations"
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    estimated_effort = models.CharField(
        max_length=10, choices=Effort.choices, default=Effort.MEDIUM
    )
    is_validated = models.BooleanField(
        default=False, help_text="Validée par l'auditeur (rôle AUDITOR)."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["risk"]
        verbose_name = "Recommandation"
        verbose_name_plural = "Recommandations"

    def __str__(self):
        return self.title

    # Catégorie et question dérivées du risque source, non dupliquées ici
    # (même principe que Question.framework en Phase 5).
    @property
    def category(self):
        return self.risk.category

    @property
    def question(self):
        return self.risk.source_answer.question if self.risk.source_answer_id else None

    @property
    def audit(self):
        return self.risk.audit


class RecommendationTemplate(models.Model):
    """
    Définit une recommandation à générer automatiquement quand un
    RiskTemplate donné se déclenche (section 14) — ex : RiskTemplate
    "Absence de MFA" → recommandation "Activer MFA pour tous les comptes
    administrateurs", priorité HIGH, effort LOW.
    """

    risk_template = models.ForeignKey(
        "risks.RiskTemplate", on_delete=models.CASCADE, related_name="recommendation_templates"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    priority = models.CharField(
        max_length=10, choices=Recommendation.Priority.choices, default=Recommendation.Priority.MEDIUM
    )
    estimated_effort = models.CharField(
        max_length=10, choices=Recommendation.Effort.choices, default=Recommendation.Effort.MEDIUM
    )

    class Meta:
        verbose_name = "Modèle de recommandation"
        verbose_name_plural = "Modèles de recommandation"

    def __str__(self):
        return f"{self.risk_template.risk_name} → {self.title}"
