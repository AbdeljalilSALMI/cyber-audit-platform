from django.core.management.base import BaseCommand
from django.db import transaction

from apps.questionnaires.models import AnswerChoice, Category, Framework, Question

# (nom du thème, poids total du thème, [(texte, poids), ...])
THEMES = [
    ("Risques et menaces", 5, [
        ("Une évaluation des risques cyber propres à votre activité a-t-elle déjà été réalisée ?", 2),
        ("Une personne est-elle clairement désignée comme responsable de la sécurité informatique ?", 2),
        ("La direction connaît-elle les différentes motivations des cyberattaques (ludique, cupide, terroriste, stratégique) ?", 1),
    ]),
    ("Gouvernance de la cybersécurité", 10, [
        ("L'entreprise dispose-t-elle d'une politique de sécurité des systèmes d'information écrite ?", 2),
        ("Une charte d'usage des systèmes d'information a-t-elle été diffusée et signée par les employés ?", 2),
        ("Des rôles et responsabilités liés à la sécurité du SI sont-ils formellement définis dans l'organisation ?", 2),
        ("Les employés bénéficient-ils d'actions régulières de sensibilisation à la cybersécurité ?", 2),
        ("L'entreprise s'appuie-t-elle sur des normes reconnues (ISO 27001/27002) pour organiser sa sécurité ?", 1),
        ("Les aspects juridiques et contractuels liés à la sécurité de l'information sont-ils pris en compte ?", 1),
    ]),
    ("Sécurité des postes, serveurs et réseau", 20, [
        ("Tous les postes de travail sont-ils protégés par un antivirus et un pare-feu à jour ?", 3),
        ("L'accès aux serveurs est-il restreint aux seules personnes autorisées ?", 3),
        ("Chaque utilisateur dispose-t-il d'un identifiant et d'une authentification personnels pour accéder au SI ?", 3),
        ("Les droits d'accès aux données sont-ils attribués selon les besoins réels de chaque utilisateur ?", 2),
        ("L'accès à distance au système d'information est-il sécurisé (VPN ou équivalent) ?", 3),
        ("Les systèmes d'exploitation et logiciels sont-ils mis à jour régulièrement ?", 3),
        ("Des règles d'utilisation d'internet encadrent-elles la navigation des employés ?", 1),
        ("Le réseau Wi-Fi de l'entreprise est-il protégé par un mot de passe et un chiffrement ?", 2),
    ]),
    ("Échanges électroniques", 9, [
        ("Les employés sont-ils sensibilisés aux risques de phishing par courrier électronique ?", 2),
        ("Les mots de passe utilisés respectent-ils des règles de complexité et sont-ils changés régulièrement ?", 3),
        ("Existe-t-il des règles pour l'envoi et le partage sécurisé d'informations sensibles ?", 2),
        ("Des contrôles existent-ils contre la fraude liée aux moyens de paiement électronique ?", 2),
    ]),
    ("Données et bonnes pratiques de base", 6, [
        ("Des sauvegardes régulières des données sont-elles réalisées et vérifiées ?", 3),
        ("Le transfert de données vers le Cloud ou des supports mobiles est-il encadré par des règles de sécurité ?", 2),
        ("La collecte et le traitement des données personnelles sont-ils encadrés par des règles de tri et de protection ?", 1),
    ]),
]

ANSWER_CHOICES = [
    ("Oui", 100),
    ("Partiellement", 50),
    ("Non", 0),
]


class Command(BaseCommand):
    help = "Charge le questionnaire du Jalon 1 : 5 thèmes, 24 questions, scoring pondéré à 3 niveaux."

    @transaction.atomic
    def handle(self, *args, **options):
        framework, created = Framework.objects.get_or_create(
            name="Guide AUSIM/CMRPI — Auto-évaluation cybersécurité PME",
            defaults={
                "description": (
                    "Référentiel basé sur le guide de bonnes pratiques AUSIM/CMRPI, "
                    "adapté en 24 questions réparties en 5 thèmes (Jalon 1)."
                ),
            },
        )
        if not created:
            self.stdout.write(self.style.WARNING(f"Référentiel déjà existant : {framework.name}"))

        total_questions = 0

        for order, (theme_name, theme_weight, questions) in enumerate(THEMES, start=1):
            category, _ = Category.objects.update_or_create(
                framework=framework,
                name=theme_name,
                defaults={"weight": theme_weight, "order": order},
            )

            for q_order, (text, weight) in enumerate(questions, start=1):
                question, _ = Question.objects.update_or_create(
                    category=category,
                    question_text=text,
                    defaults={
                        "question_type": Question.QuestionType.SINGLE_CHOICE,
                        "weight": weight,
                        "required": True,
                        "order": q_order,
                        "active": True,
                    },
                )

                for c_order, (label, percentage) in enumerate(ANSWER_CHOICES, start=1):
                    AnswerChoice.objects.update_or_create(
                        question=question,
                        label=label,
                        defaults={"percentage": percentage, "order": c_order},
                    )

                total_questions += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Questionnaire Jalon 1 chargé : {len(THEMES)} thèmes, "
                f"{total_questions} questions, {total_questions * 3} choix de réponse."
            )
        )
