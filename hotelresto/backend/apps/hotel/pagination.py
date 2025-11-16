from rest_framework.pagination import PageNumberPagination


class FlexiblePageNumberPagination(PageNumberPagination):
    """
    Pagination class that allows the client to control page size
    via the page_size query parameter (e.g., ?page_size=100)
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 1000
