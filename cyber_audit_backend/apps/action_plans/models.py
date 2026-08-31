from django.conf import settings
from django.db import models
from django.utils import timezone


class Action(models.Model):
    class Status(models.TextChoices):
        TODO = "TODO", "À faire"
        IN_PROGRESS = "IN_PROGRESS", "En cours"
        BLOCKED = "BLOCKED", "Bloquée"
        COMPLETED = "COMPLETED", "Terminée"

    class Priority(models.TextChoices):
        LOW = "LOW", "Faible"
        MEDIUM = "MEDIUM", "Moyenne"
        HIGH = "HIGH", "Haute"

    class Effort(models.TextChoices):
        LOW = "LOW", "Faible"
        MEDIUM = "MEDIUM", "Moyen"
        HIGH = "HIGH", "Élevé"

    recommendation = models.ForeignKey(
        "recommendations.Recommendation", on_delete=models.CASCADE, related_name="actions"
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    estimated_effort = models.CharField(
        max_length=10, choices=Effort.choices, default=Effort.MEDIUM
    )
    responsible_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_actions",
    )
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)

    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["due_date", "recommendation"]
        verbose_name = "Action"
        verbose_name_plural = "Plan d'action"

    def __str__(self):
        return self.title

    # Risque et audit dérivés de la recommandation, non dupliqués ici
    # (même principe que Question.framework en Phase 5 et
    # Recommendation.category/question en Phase 9).
    @property
    def risk(self):
        return self.recommendation.risk

    @property
    def audit(self):
        return self.recommendation.risk.audit

    def save(self, *args, **kwargs):
        if self.status == self.Status.COMPLETED and self.completed_at is None:
            self.completed_at = timezone.now()
        elif self.status != self.Status.COMPLETED:
            self.completed_at = None
        super().save(*args, **kwargs)
