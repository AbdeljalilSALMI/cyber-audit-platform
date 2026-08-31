from django.core.management.base import BaseCommand

from apps.scoring.models import MaturityLevel

LEVELS = [
    ("Initial", 0, 20, "Aucune démarche structurée de cybersécurité."),
    ("Basique", 21, 40, "Quelques mesures ponctuelles, non formalisées."),
    ("Intermédiaire", 41, 60, "Des pratiques existent mais restent incomplètes."),
    ("Maîtrisé", 61, 80, "La majorité des bonnes pratiques sont en place."),
    ("Optimisé", 81, 100, "Démarche de cybersécurité mature et formalisée."),
]


class Command(BaseCommand):
    help = "Charge les 5 niveaux de maturité du Jalon 1 (Initial à Optimisé)."

    def handle(self, *args, **options):
        for order, (name, min_pct, max_pct, description) in enumerate(LEVELS, start=1):
            MaturityLevel.objects.update_or_create(
                name=name,
                defaults={
                    "min_percentage": min_pct,
                    "max_percentage": max_pct,
                    "description": description,
                    "order": order,
                },
            )
        self.stdout.write(self.style.SUCCESS(f"{len(LEVELS)} niveaux de maturité chargés."))
