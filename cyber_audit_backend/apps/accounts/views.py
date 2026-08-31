from rest_framework import permissions, viewsets
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .permissions import IsPlatformAdmin
from .serializers import UserSerializer


class MeView(RetrieveAPIView):
    """GET /api/auth/me/ — profil de l'utilisateur connecté."""

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ThrottledTokenObtainPairView(TokenObtainPairView):
    """
    Identique à TokenObtainPairView, avec une limite de débit (section 22)
    pour freiner les tentatives de connexion par force brute.
    """

    throttle_scope = "login"


class UserViewSet(viewsets.ModelViewSet):
    """
    Gestion des utilisateurs. Lecture : ADMIN/AUDITOR voient tout ; les
    rôles COMPANY_* ne voient que les utilisateurs de leur organisation.
    Écriture : réservée à ADMIN.
    """

    serializer_class = UserSerializer
    filterset_fields = ["role", "organization", "is_active"]
    search_fields = ["username", "email", "first_name", "last_name"]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsPlatformAdmin()]

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.all()
        if user.is_platform_admin or user.is_auditor:
            return qs
        if user.organization_id:
            return qs.filter(organization_id=user.organization_id)
        return qs.filter(id=user.id)
