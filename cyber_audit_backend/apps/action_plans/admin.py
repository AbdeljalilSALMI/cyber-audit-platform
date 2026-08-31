from django.contrib import admin

from .models import Action


@admin.register(Action)
class ActionAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "recommendation",
        "priority",
        "estimated_effort",
        "responsible_user",
        "due_date",
        "status",
    )
    list_filter = ("status", "priority", "estimated_effort", "recommendation__risk__audit__organization")
    search_fields = ("title", "description")
    readonly_fields = ("created_at", "completed_at")
    date_hierarchy = "due_date"
