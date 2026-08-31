from django.contrib import admin

from .models import Organization


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "sector", "company_size", "country", "city", "created_at")
    list_filter = ("company_size", "country")
    search_fields = ("name", "contact_email", "city", "sector")
    ordering = ("name",)
    readonly_fields = ("created_at", "updated_at")
