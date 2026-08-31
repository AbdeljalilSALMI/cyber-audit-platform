from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Risk(models.Model):
    class Severity(models.TextChoices):
        LOW = "LOW", "Faible"
        MEDIUM = "MEDIUM", "Moyen"
        HIGH = "HIGH", "Élevé"
        CRITICAL = "CRITICAL", "Critique"

    class Status(models.TextChoices):
        IDENTIFIED = "IDENTIFIED", "Identifié"
        IN_TREATMENT = "IN_TREATMENT", "En traitement"
        MITIGATED = "MITIGATED", "Atténué"
        ACCEPTED = "ACCEPTED", "Accepté"

    audit = models.ForeignKey("audits.Audit", on_delete=models.CASCADE, related_name="risks")
    category = models.ForeignKey(
        "questionnaires.Category", on_delete=models.PROTECT, related_name="risks"
    )
    source_answer = models.ForeignKey(
        "audits.Answer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="generated_risks",
        help_text="Réponse à l'origine de ce risque, si généré automatiquement.",
    )

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    probability = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    impact = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    risk_score = models.PositiveSmallIntegerField(editable=False, default=0)
    severity = models.CharField(max_length=10, choices=Severity.choices, editable=False, blank=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IDENTIFIED)

    identified_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-risk_score"]
        verbose_name = "Risque"
        verbose_name_plural = "Risques"

    def __str__(self):
        return f"{self.name} ({self.get_severity_display()})"

    @staticmethod
    def severity_for_score(score):
        if score >= 17:
            return Risk.Severity.CRITICAL
        if score >= 10:
            return Risk.Severity.HIGH
        if score >= 5:
            return Risk.Severity.MEDIUM
        return Risk.Severity.LOW

    def save(self, *args, **kwargs):
        self.risk_score = self.probability * self.impact
        self.severity = self.severity_for_score(self.risk_score)
        super().save(*args, **kwargs)


class RiskTemplate(models.Model):
    """
    Définit un risque à générer automatiquement quand une question reçoit
    un choix de réponse donné (section 13) — ex : "Les sauvegardes sont-
    elles testées ?" = "Non" → risque "Perte de données", probabilité 4,
    impact 5.
    """

    question = models.ForeignKey(
        "questionnaires.Question", on_delete=models.CASCADE, related_name="risk_templates"
    )
    trigger_choice = models.ForeignKey(
        "questionnaires.AnswerChoice", on_delete=models.CASCADE, related_name="risk_templates"
    )

    risk_name = models.CharField(max_length=255)
    risk_description = models.TextField(blank=True)
    default_probability = models.PositiveSmallIntegerField(
        default=3, validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    default_impact = models.PositiveSmallIntegerField(
        default=3, validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    class Meta:
        verbose_name = "Modèle de risque"
        verbose_name_plural = "Modèles de risque"
        unique_together = ("question", "trigger_choice")

    def __str__(self):
        return f"{self.question.question_text[:40]} = {self.trigger_choice.label} → {self.risk_name}"
