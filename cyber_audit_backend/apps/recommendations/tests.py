from django.test import TestCase

from apps.audits.models import Answer, Audit
from apps.organizations.models import Organization
from apps.questionnaires.models import AnswerChoice, Category, Framework, Question
from apps.recommendations.models import Recommendation, RecommendationTemplate
from apps.recommendations.services import generate_recommendations_for_audit
from apps.risks.models import RiskTemplate
from apps.risks.services import generate_risks_for_audit


class RecommendationEngineTests(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="TechnoPME Test")
        self.framework = Framework.objects.create(name="Référentiel Test")
        self.category = Category.objects.create(framework=self.framework, name="Accès", weight=2)
        self.question = Question.objects.create(
            category=self.category, question_text="MFA activé ?", weight=2
        )
        self.choice_non = AnswerChoice.objects.create(question=self.question, label="Non", percentage=0)
        self.audit = Audit.objects.create(organization=self.org, framework=self.framework)

        self.risk_template = RiskTemplate.objects.create(
            question=self.question, trigger_choice=self.choice_non,
            risk_name="Absence de MFA", default_probability=3, default_impact=4,
        )
        self.reco_template = RecommendationTemplate.objects.create(
            risk_template=self.risk_template,
            title="Activer MFA pour tous les comptes administrateurs",
            priority="HIGH",
            estimated_effort="LOW",
        )

    def test_generate_recommendations_from_triggered_risk(self):
        Answer.objects.create(audit=self.audit, question=self.question, answer_choice=self.choice_non)
        generate_risks_for_audit(self.audit)

        created = generate_recommendations_for_audit(self.audit)

        self.assertEqual(len(created), 1)
        reco = Recommendation.objects.get()
        self.assertEqual(reco.title, "Activer MFA pour tous les comptes administrateurs")
        self.assertEqual(reco.priority, "HIGH")
        self.assertEqual(reco.category, self.category)  # dérivé du risque
        self.assertEqual(reco.audit, self.audit)  # dérivé du risque

    def test_no_recommendation_without_matching_risk(self):
        created = generate_recommendations_for_audit(self.audit)
        self.assertEqual(len(created), 0)
