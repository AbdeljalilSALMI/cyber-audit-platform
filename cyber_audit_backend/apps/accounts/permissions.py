"""
Permissions réutilisables par toutes les apps (évite de dupliquer la
logique de rôle dans chaque views.py).
"""

from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsPlatformAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_platform_admin)


class IsAuditorOrAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and (user.is_platform_admin or user.is_auditor)
        )


class ReadOnlyOrAuditorAdmin(BasePermission):
    """Lecture pour tout utilisateur authentifié, écriture réservée à ADMIN/AUDITOR."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return user.is_platform_admin or user.is_auditor


class OrganizationScopedQuerysetMixin:
    """
    Restreint le queryset à l'organisation de l'utilisateur pour les rôles
    COMPANY_ADMIN/COMPANY_USER. Les rôles ADMIN/AUDITOR voient tout.

    `org_lookup` est le chemin ORM vers Organization depuis le modèle du
    ViewSet (ex : "organization", "audit__organization",
    "risk__audit__organization").
    """

    org_lookup = "organization"

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_platform_admin or user.is_auditor:
            return qs
        if user.organization_id:
            return qs.filter(**{f"{self.org_lookup}_id": user.organization_id})
        return qs.none()
