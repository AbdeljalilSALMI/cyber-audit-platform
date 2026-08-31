"""
Logique de notification (section 19).

Architecture volontairement extensible : notify() est le point d'entrée
unique. Ajouter l'envoi email plus tard ne demandera qu'une modification
ici (ex: appeler send_mail() en plus de Notification.objects.create()),
sans toucher aux appelants.
"""

from datetime import timedelta

from django.utils import timezone

from apps.notifications.models import Notification


def notify(recipient, notification_type, title, message="", target_url=""):
    return Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        target_url=target_url,
    )


def notify_audit_completed(audit):
    recipients = list(audit.organization.users.filter(role="COMPANY_ADMIN"))
    if audit.auditor:
        recipients.append(audit.auditor)

    for user in recipients:
        notify(
            recipient=user,
            notification_type=Notification.NotificationType.AUDIT_COMPLETED,
            title=f"Audit terminé — {audit.organization.name}",
            message=(
                f"L'audit a été complété avec un score de "
                f"{audit.overall_score}/100 ({audit.maturity_level_label})."
            ),
            target_url=f"/audits/{audit.id}/",
        )


def notify_new_recommendation(recommendation):
    audit = recommendation.risk.audit
    for user in audit.organization.users.filter(role="COMPANY_ADMIN"):
        notify(
            recipient=user,
            notification_type=Notification.NotificationType.NEW_RECOMMENDATION,
            title="Nouvelle recommandation",
            message=recommendation.title,
            target_url=f"/audits/{audit.id}/recommendations/",
        )


def check_action_deadlines():
    """
    Notifie les responsables des actions en retard ou dont l'échéance
    approche (7 jours). Prévu pour être exécuté périodiquement — voir la
    commande de gestion check_action_deadlines (à planifier via le
    Planificateur de tâches Windows ou cron).
    """
    from apps.action_plans.models import Action

    today = timezone.now().date()
    soon = today + timedelta(days=7)

    overdue = Action.objects.filter(
        due_date__lt=today, responsible_user__isnull=False
    ).exclude(status=Action.Status.COMPLETED)
    for action_item in overdue:
        notify(
            recipient=action_item.responsible_user,
            notification_type=Notification.NotificationType.ACTION_OVERDUE,
            title=f"Action en retard : {action_item.title}",
            target_url=f"/action-plans/{action_item.id}/",
        )

    due_soon = Action.objects.filter(
        due_date__gte=today, due_date__lte=soon, responsible_user__isnull=False
    ).exclude(status=Action.Status.COMPLETED)
    for action_item in due_soon:
        notify(
            recipient=action_item.responsible_user,
            notification_type=Notification.NotificationType.ACTION_DUE_SOON,
            title=f"Échéance proche : {action_item.title}",
            target_url=f"/action-plans/{action_item.id}/",
        )
