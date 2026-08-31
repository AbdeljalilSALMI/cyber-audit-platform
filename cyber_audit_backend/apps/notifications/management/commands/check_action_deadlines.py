from django.core.management.base import BaseCommand

from apps.notifications.services import check_action_deadlines


class Command(BaseCommand):
    help = (
        "Notifie les responsables des actions en retard ou proches de "
        "l'échéance. À planifier périodiquement (ex: une fois par jour)."
    )

    def handle(self, *args, **options):
        check_action_deadlines()
        self.stdout.write(self.style.SUCCESS("Vérification des échéances terminée."))
