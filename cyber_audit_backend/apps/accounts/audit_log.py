"""
Helper pour tracer les actions sensibles (section 22) : qui, quoi, sur
quelle ressource, quand, depuis quelle IP.
"""

from apps.accounts.models import AuditLog


def get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def log_action(request, action, resource=""):
    user = getattr(request, "user", None)
    if user is not None and not user.is_authenticated:
        user = None
    AuditLog.objects.create(
        user=user,
        action=action,
        resource=resource,
        ip_address=get_client_ip(request),
    )
