from django.conf import settings
from django.db import models


class Notification(models.Model):
    """
    Notification adressée à un utilisateur (section 19). Architecture
    volontairement simple et extensible : le type détermine le sujet, le
    canal (in-app pour l'instant, email pourra être ajouté plus tard sans
    changer ce modèle — voir NotificationChannel).
    """

    class NotificationType(models.TextChoices):
        NEW_QUESTIONNAIRE = "NEW_QUESTIONNAIRE", "Nouveau questionnaire"
        QUESTIONNAIRE_PENDING = "QUESTIONNAIRE_PENDING", "Questionnaire à compléter"
        AUDIT_COMPLETED = "AUDIT_COMPLETED", "Audit terminé"
        NEW_RECOMMENDATION = "NEW_RECOMMENDATION", "Nouvelle recommandation"
        ACTION_DUE_SOON = "ACTION_DUE_SOON", "Action proche de l'échéance"
        ACTION_OVERDUE = "ACTION_OVERDUE", "Action en retard"
        AUDIT_VALIDATED = "AUDIT_VALIDATED", "Validation d'un audit"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)

    # Lien optionnel vers l'objet concerné (audit, action, etc.), pour que
    # le frontend puisse rediriger directement dessus sans logique dédiée
    # par type de notification.
    target_url = models.CharField(max_length=500, blank=True)

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return f"{self.get_notification_type_display()} — {self.recipient}"

    def mark_as_read(self):
        if not self.is_read:
            from django.utils import timezone

            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=["is_read", "read_at"])
