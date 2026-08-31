from django.conf import settings
from django.db import models


class Report(models.Model):
    audit = models.ForeignKey("audits.Audit", on_delete=models.CASCADE, related_name="reports")
    file = models.FileField(upload_to="reports/%Y/%m/")
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="generated_reports",
    )
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-generated_at"]
        verbose_name = "Rapport"
        verbose_name_plural = "Rapports"

    def __str__(self):
        return f"Rapport — {self.audit} ({self.generated_at:%Y-%m-%d %H:%M})"
