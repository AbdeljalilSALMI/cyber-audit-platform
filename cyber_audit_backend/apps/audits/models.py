from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models

ALLOWED_EVIDENCE_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "docx", "xlsx"]
MAX_EVIDENCE_SIZE_MB = 10


def validate_evidence_size(file):
    max_bytes = MAX_EVIDENCE_SIZE_MB * 1024 * 1024
    if file.size > max_bytes:
        raise ValidationError(f"Le fichier dépasse la taille maximale de {MAX_EVIDENCE_SIZE_MB} Mo.")


class Audit(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Brouillon"
        IN_PROGRESS = "IN_PROGRESS", "En cours"
        SUBMITTED = "SUBMITTED", "Soumis"
        UNDER_REVIEW = "UNDER_REVIEW", "En cours de revue"
        COMPLETED = "COMPLETED", "Terminé"
        ARCHIVED = "ARCHIVED", "Archivé"

    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="audits"
    )
    framework = models.ForeignKey(
        "questionnaires.Framework", on_delete=models.PROTECT, related_name="audits"
    )
    auditor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audits_conducted",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    # Champs "cache" renseignés par le moteur de scoring (Phase 7) une fois
    # l'audit terminé. Voir note d'architecture : maturity_level_label est
    # un libellé figé (snapshot), pas une FK, pour préserver l'historique.
    overall_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    maturity_level_label = models.CharField(max_length=100, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Audit"
        verbose_name_plural = "Audits"

    def __str__(self):
        return f"Audit {self.organization.name} — {self.get_status_display()}"


class Answer(models.Model):
    audit = models.ForeignKey(Audit, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(
        "questionnaires.Question", on_delete=models.PROTECT, related_name="answers"
    )
    answer_choice = models.ForeignKey(
        "questionnaires.AnswerChoice",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="answers",
    )
    comment = models.TextField(blank=True)
    evidence = models.FileField(
        upload_to="evidence/%Y/%m/",
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(allowed_extensions=ALLOWED_EVIDENCE_EXTENSIONS),
            validate_evidence_size,
        ],
    )

    # Calculé automatiquement à la sauvegarde : Question Score = Answer Score × Question Weight
    computed_score = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True, editable=False
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["audit", "question__category__order", "question__order"]
        verbose_name = "Réponse"
        verbose_name_plural = "Réponses"
        unique_together = ("audit", "question")

    def __str__(self):
        return f"{self.audit} — {self.question.question_text[:50]}"

    def clean(self):
        if self.answer_choice_id and self.answer_choice.question_id != self.question_id:
            raise ValidationError(
                "Le choix de réponse sélectionné n'appartient pas à cette question."
            )

    def save(self, *args, **kwargs):
        if self.answer_choice_id:
            self.computed_score = self.question.weight * (self.answer_choice.percentage / 100)
        else:
            self.computed_score = None
        super().save(*args, **kwargs)
