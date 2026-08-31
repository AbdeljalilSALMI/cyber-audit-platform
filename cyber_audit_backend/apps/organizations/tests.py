from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User
from apps.organizations.models import Organization


class OrganizationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            username="admin", password="testpass123!", role="ADMIN"
        )

    def test_create_organization_via_api(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            "/api/organizations/",
            {"name": "Nouvelle PME", "sector": "Santé", "company_size": "SMALL", "country": "Maroc"},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Organization.objects.filter(name="Nouvelle PME").exists())

    def test_organization_str(self):
        org = Organization.objects.create(name="Test SARL")
        self.assertEqual(str(org), "Test SARL")
