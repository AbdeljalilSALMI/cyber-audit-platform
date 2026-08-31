from django.db import models


class Organization(models.Model):
    """
    Une PME cliente de la plateforme.

    Une organisation peut avoir plusieurs utilisateurs (apps.accounts, Phase 4)
    et plusieurs audits (apps.audits, Phase 6). Ces relations seront ajoutées
    via ForeignKey depuis les apps concernées, pour éviter toute dépendance
    de organizations vers des apps créées plus tard.
    """

    class CompanySize(models.TextChoices):
        MICRO = "MICRO", "Micro (< 10 employés)"
        SMALL = "SMALL", "Petite (10 à 49 employés)"
        MEDIUM = "MEDIUM", "Moyenne (50 à 249 employés)"
        LARGE = "LARGE", "Grande (250 employés et plus)"

    name = models.CharField(max_length=255)
    sector = models.CharField(max_length=255, blank=True)
    company_size = models.CharField(
        max_length=10, choices=CompanySize.choices, blank=True
    )
    country = models.CharField(max_length=100, default="Maroc")
    city = models.CharField(max_length=100, blank=True)
    contact_email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    website = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Organisation"
        verbose_name_plural = "Organisations"

    def __str__(self):
        return self.name
