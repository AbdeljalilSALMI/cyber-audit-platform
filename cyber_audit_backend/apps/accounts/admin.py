from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import AuditLog, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "role",
        "organization",
        "is_active",
        "is_staff",
    )
    list_filter = ("role", "is_active", "is_staff", "organization")
    search_fields = ("username", "email", "first_name", "last_name")

    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Rôle et organisation", {"fields": ("role", "organization")}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("Rôle et organisation", {"fields": ("role", "organization")}),
    )


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "user", "action", "resource", "ip_address")
    list_filter = ("action",)
    search_fields = ("user__username", "action", "resource", "ip_address")
    readonly_fields = ("user", "action", "resource", "ip_address", "created_at")
    ordering = ("-created_at",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
