from django.core.files.base import ContentFile

from apps.reports.models import Report
from apps.reports.pdf_builder import build_audit_report_pdf


def generate_report_for_audit(audit, generated_by=None):
    pdf_buffer = build_audit_report_pdf(audit)
    filename = f"audit_{audit.id}_{audit.organization.name}.pdf".replace(" ", "_")

    report = Report(audit=audit, generated_by=generated_by)
    report.file.save(filename, ContentFile(pdf_buffer.read()), save=True)
    return report
