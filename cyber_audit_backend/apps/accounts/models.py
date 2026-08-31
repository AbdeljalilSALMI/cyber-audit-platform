from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Administrateur plateforme"
        AUDITOR = "AUDITOR", "Auditeur"
        COMPANY_ADMIN = "COMPANY_ADMIN", "Administrateur PME"
        COMPANY_USER = "COMPANY_USER", "Utilisateur PME"

    role = models.CharField(max_length=20, choices=Role.choices)

    # Renseigné uniquement pour COMPANY_ADMIN et COMPANY_USER. Référencé par
    # chaîne "organizations.Organization" pour éviter tout import circulaire
    # entre apps.accounts et apps.organizations.
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="users",
        null=True,
        blank=True,
        help_text="Renseigné uniquement pour les rôles COMPANY_ADMIN et COMPANY_USER.",
    )

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

    def __str__(self):
        return self.get_full_name() or self.username

    @property
    def is_platform_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_auditor(self):
        return self.role == self.Role.AUDITOR

    @property
    def is_company_admin(self):
        return self.role == self.Role.COMPANY_ADMIN

    @property
    def is_company_user(self):
        return self.role == self.Role.COMPANY_USER


class AuditLog(models.Model):
    """
    Journal de sécurité (section 22) : qui a fait quoi, sur quelle
    ressource, quand, depuis quelle adresse IP. Distinct du modèle Audit
    (apps.audits) qui représente un audit de cybersécurité métier — celui-ci
    trace l'activité technique sur la plateforme elle-même.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=100)
    resource = models.CharField(max_length=255, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Journal d'audit"
        verbose_name_plural = "Journal d'audit"

    def __str__(self):
        return f"{self.created_at:%Y-%m-%d %H:%M} — {self.user} — {self.action}"
