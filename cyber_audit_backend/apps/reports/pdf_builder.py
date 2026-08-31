"""
Génération du rapport d'audit PDF (section 18), avec reportlab — bibliothèque
pure Python depuis la version 4.0, donc aucune dépendance système (contrairement
à WeasyPrint ou wkhtmltopdf, souvent problématiques à installer sous Windows).
"""

import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def build_audit_report_pdf(audit):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleCustom", parent=styles["Title"], spaceAfter=12)
    h2 = ParagraphStyle("H2Custom", parent=styles["Heading2"], spaceBefore=14, spaceAfter=6)
    body = styles["BodyText"]

    story = [
        Paragraph("Rapport d'audit de cybersécurité", title_style),
        Paragraph(audit.organization.name, styles["Heading3"]),
        Spacer(1, 0.5 * cm),
    ]

    # 1. Informations de la PME
    story.append(Paragraph("1. Informations de la PME", h2))
    org = audit.organization
    story.append(_simple_table([
        ["Nom", org.name],
        ["Secteur", org.sector or "—"],
        ["Taille", org.get_company_size_display() if org.company_size else "—"],
        ["Pays / Ville", f"{org.country} / {org.city or '—'}"],
        ["Contact", org.contact_email or "—"],
    ]))

    # 2. Informations de l'audit
    story.append(Paragraph("2. Informations de l'audit", h2))
    story.append(_simple_table([
        ["Référentiel", audit.framework.name],
        ["Auditeur", str(audit.auditor) if audit.auditor else "—"],
        ["Statut", audit.get_status_display()],
        ["Période", f"{audit.start_date or '—'} → {audit.end_date or '—'}"],
    ]))

    # 3. Méthodologie
    story.append(Paragraph("3. Méthodologie", h2))
    story.append(Paragraph(
        "L'évaluation repose sur un questionnaire pondéré : chaque question a un poids "
        "reflétant son importance, et chaque réponse (Oui / Partiellement / Non) rapporte "
        "un pourcentage de ce poids (100&nbsp;%, 50&nbsp;%, 0&nbsp;%). Le score de chaque "
        "catégorie est la somme des points obtenus rapportée à son maximum théorique ; le "
        "score global est calculé de la même façon sur l'ensemble des questions.",
        body,
    ))

    # 4. Score global
    story.append(Paragraph("4. Score global", h2))
    score_display = f"{audit.overall_score} / 100" if audit.overall_score is not None else "—"
    story.append(Paragraph(f"<b>{score_display}</b>", body))

    # 5. Niveau de maturité
    story.append(Paragraph("5. Niveau de maturité", h2))
    story.append(Paragraph(f"<b>{audit.maturity_level_label or '—'}</b>", body))

    # 6. Score par domaine
    story.append(Paragraph("6. Score par domaine", h2))
    category_scores = audit.scores.filter(category__isnull=False).select_related("category")
    score_data = [["Catégorie", "Points", "Max", "%"]]
    for s in category_scores:
        score_data.append([s.category.name, str(s.raw_points), str(s.max_points), f"{s.percentage} %"])
    if len(score_data) > 1:
        story.append(_simple_table(score_data, header=True))
    else:
        story.append(Paragraph("Aucun score calculé pour cet audit.", body))

    # 7. Risques identifiés
    story.append(Paragraph("7. Risques identifiés", h2))
    risks = list(audit.risks.select_related("category").order_by("-risk_score"))
    if risks:
        risk_data = [["Risque", "Catégorie", "Probabilité", "Impact", "Score", "Sévérité"]]
        for r in risks:
            risk_data.append(
                [r.name, r.category.name, str(r.probability), str(r.impact),
                 str(r.risk_score), r.get_severity_display()]
            )
        story.append(_simple_table(risk_data, header=True))
    else:
        story.append(Paragraph("Aucun risque identifié.", body))

    # 8. Matrice des risques (5×5)
    story.append(Paragraph("8. Matrice des risques (probabilité × impact)", h2))
    story.append(_risk_matrix_table(risks))

    # 9. Recommandations
    story.append(Paragraph("9. Recommandations", h2))
    from apps.recommendations.models import Recommendation

    recommendations = list(Recommendation.objects.filter(risk__audit=audit))
    if recommendations:
        reco_data = [["Recommandation", "Priorité", "Effort"]]
        for r in recommendations:
            reco_data.append([r.title, r.get_priority_display(), r.get_estimated_effort_display()])
        story.append(_simple_table(reco_data, header=True))
    else:
        story.append(Paragraph("Aucune recommandation.", body))

    # 10. Plan d'action
    story.append(Paragraph("10. Plan d'action", h2))
    from apps.action_plans.models import Action

    actions = list(Action.objects.filter(recommendation__risk__audit=audit))
    if actions:
        action_data = [["Action", "Statut", "Échéance", "Responsable"]]
        for a in actions:
            action_data.append(
                [a.title, a.get_status_display(), str(a.due_date or "—"), str(a.responsible_user or "—")]
            )
        story.append(_simple_table(action_data, header=True))
    else:
        story.append(Paragraph("Aucune action planifiée.", body))

    # 11. Conclusion
    story.append(Paragraph("11. Conclusion", h2))
    story.append(Paragraph(_conclusion_text(audit, risks), body))

    doc.build(story)
    buffer.seek(0)
    return buffer


def _simple_table(data, header=False):
    table = Table(data, hAlign="LEFT")
    style = [
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]
    if header:
        style += [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ]
    table.setStyle(TableStyle(style))
    return table


def _risk_matrix_table(risks):
    grid = [[0] * 5 for _ in range(5)]  # grid[probabilité-1][impact-1]
    for r in risks:
        if 1 <= r.probability <= 5 and 1 <= r.impact <= 5:
            grid[r.probability - 1][r.impact - 1] += 1

    data = [["P \\ I"] + [str(i) for i in range(1, 6)]]
    for p in range(5, 0, -1):
        data.append([str(p)] + [str(grid[p - 1][i]) for i in range(5)])

    table = Table(data, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#2c3e50")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (1, 1), (-1, -1), "CENTER"),
    ]))
    return table


def _conclusion_text(audit, risks):
    level = audit.maturity_level_label or "non déterminé"
    score = audit.overall_score if audit.overall_score is not None else "—"
    critical = sum(1 for r in risks if r.severity == "CRITICAL")
    high = sum(1 for r in risks if r.severity == "HIGH")
    return (
        f"Avec un score global de {score}/100, {audit.organization.name} se situe au "
        f"niveau de maturité « {level} ». L'audit a identifié {critical} risque(s) "
        f"critique(s) et {high} risque(s) élevé(s). Il est recommandé de prioriser le "
        f"traitement des recommandations à priorité haute avant le prochain cycle "
        f"d'évaluation, afin de progresser vers un niveau de maturité supérieur."
    )
