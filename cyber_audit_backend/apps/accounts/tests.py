from django.test import TestCase  # noqa: F401

# Tests détaillés ajoutés en Phase 14, au fur et à mesure des modèles
# et de la logique métier de cette app.


from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User
from apps.organizations.models import Organization
from apps.audits.models import Audit
from apps.questionnaires.models import Framework


class AuthenticationTests(TestCase):
    """Tests d'authentification et de permissions (section 24)."""

    def setUp(self):
        self.client = APIClient()
        self.org_a = Organization.objects.create(name="Org A")
        self.org_b = Organization.objects.create(name="Org B")
        self.framework = Framework.objects.create(name="Référentiel Test")

        self.user_a = User.objects.create_user(
            username="user_a", password="testpass123!", role="COMPANY_ADMIN", organization=self.org_a
        )
        self.user_b = User.objects.create_user(
            username="user_b", password="testpass123!", role="COMPANY_ADMIN", organization=self.org_b
        )
        self.admin_user = User.objects.create_user(
            username="platform_admin", password="testpass123!", role="ADMIN"
        )

        self.audit_a = Audit.objects.create(organization=self.org_a, framework=self.framework)
        self.audit_b = Audit.objects.create(organization=self.org_b, framework=self.framework)

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.get("/api/audits/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_returns_access_token(self):
        response = self.client.post(
            "/api/auth/login/", {"username": "user_a", "password": "testpass123!"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_with_wrong_password_fails(self):
        response = self.client.post(
            "/api/auth/login/", {"username": "user_a", "password": "wrongpassword"}
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_company_user_only_sees_own_organization_audits(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get("/api/audits/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        audit_ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.audit_a.id, audit_ids)
        self.assertNotIn(self.audit_b.id, audit_ids)

    def test_platform_admin_sees_all_audits(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/audits/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        audit_ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.audit_a.id, audit_ids)
        self.assertIn(self.audit_b.id, audit_ids)

    def test_user_role_properties(self):
        self.assertTrue(self.admin_user.is_platform_admin)
        self.assertFalse(self.admin_user.is_auditor)
        self.assertTrue(self.user_a.is_company_admin)
        self.assertFalse(self.user_a.is_platform_admin)
