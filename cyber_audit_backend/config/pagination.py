from rest_framework.pagination import PageNumberPagination


class DefaultPagination(PageNumberPagination):
    """
    Identique à PageNumberPagination, avec le paramètre ?page_size=
    effectivement pris en compte (la classe de base de DRF l'ignore par
    défaut tant que page_size_query_param n'est pas défini).
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 500
