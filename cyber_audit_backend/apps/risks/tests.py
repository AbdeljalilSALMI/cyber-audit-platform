from django.test import TestCase

from apps.audits.models import Answer, Audit
from apps.organizations.models import Organization
from apps.questionnaires.models import AnswerChoice, Category, Framework, Question
from apps.risks.models import Risk, RiskTemplate
from apps.risks.services import generate_risks_for_audit


class RiskEngineTests(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="TechnoPME Test")
        self.framework = Framework.objects.create(name="Référentiel Test")
        self.category = Category.objects.create(framework=self.framework, name="Données", weight=3)
        self.question = Question.objects.create(
            category=self.category, question_text="Sauvegardes testées ?", weight=3
        )
        self.choice_non = AnswerChoice.objects.create(question=self.question, label="Non", percentage=0)
        self.audit = Audit.objects.create(organization=self.org, framework=self.framework)

        self.template = RiskTemplate.objects.create(
            question=self.question,
            trigger_choice=self.choice_non,
            risk_name="Perte de données",
            default_probability=4,
            default_impact=5,
        )

    def test_risk_score_and_severity_computed_on_save(self):
        risk = Risk.objects.create(
            audit=self.audit, category=self.category, name="Test", probability=4, impact=5
        )
        self.assertEqual(risk.risk_score, 20)
        self.assertEqual(risk.severity, Risk.Severity.CRITICAL)  # 17-25

    def test_severity_thresholds(self):
        cases = [(1, 1, Risk.Severity.LOW), (2, 3, Risk.Severity.MEDIUM), (3, 4, Risk.Severity.HIGH), (5, 5, Risk.Severity.CRITICAL)]
        for probability, impact, expected in cases:
            risk = Risk.objects.create(
                audit=self.audit, category=self.category, name="Test",
                probability=probability, impact=impact,
            )
            self.assertEqual(risk.severity, expected, f"probability={probability} impact={impact}")

    def test_generate_risks_creates_risk_from_matching_template(self):
        Answer.objects.create(audit=self.audit, question=self.question, answer_choice=self.choice_non)

        created = generate_risks_for_audit(self.audit)

        self.assertEqual(len(created), 1)
        risk = Risk.objects.get(audit=self.audit)
        self.assertEqual(risk.name, "Perte de données")
        self.assertEqual(risk.probability, 4)
        self.assertEqual(risk.impact, 5)
        self.assertEqual(risk.risk_score, 20)

    def test_generate_risks_ignores_non_triggering_answer(self):
        choice_oui = AnswerChoice.objects.create(question=self.question, label="Oui", percentage=100)
        Answer.objects.create(audit=self.audit, question=self.question, answer_choice=choice_oui)

        created = generate_risks_for_audit(self.audit)

        self.assertEqual(len(created), 0)
        self.assertEqual(Risk.objects.filter(audit=self.audit).count(), 0)

    def test_generate_risks_is_idempotent(self):
        Answer.objects.create(audit=self.audit, question=self.question, answer_choice=self.choice_non)
        generate_risks_for_audit(self.audit)
        generate_risks_for_audit(self.audit)
        self.assertEqual(Risk.objects.filter(audit=self.audit).count(), 1)
