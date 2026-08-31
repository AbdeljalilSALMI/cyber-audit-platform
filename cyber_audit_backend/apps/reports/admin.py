from django.contrib import admin

from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("audit", "generated_by", "generated_at", "file")
    list_filter = ("audit__organization",)
    readonly_fields = ("generated_at",)
