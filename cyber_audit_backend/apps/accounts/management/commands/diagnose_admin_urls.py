import traceback

from django.core.management.base import BaseCommand
from django.urls import get_resolver


class Command(BaseCommand):
    help = "Diagnostic : populate() chaque resolver racine individuellement pour isoler la vraie erreur."

    def handle(self, *args, **options):
        root_resolver = get_resolver()

        for pattern in root_resolver.url_patterns:
            label = getattr(pattern, "pattern", pattern)
            try:
                # Force la population de CE resolver précis (s'il en est un).
                if hasattr(pattern, "_populate"):
                    pattern._populate()
                self.stdout.write(self.style.SUCCESS(f"OK   {label}"))
            except Exception:
                self.stdout.write(self.style.ERROR(f"FAIL {label}"))
                self.stdout.write(self.style.ERROR(traceback.format_exc()))
                self.stdout.write("-" * 80)
