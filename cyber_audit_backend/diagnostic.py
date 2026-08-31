from django.apps import apps as django_apps
from django.urls import reverse

for app_config in django_apps.get_app_configs():
    try:
        url = reverse('admin:app_list', kwargs={'app_label': app_config.label})
        print('OK  ', app_config.label, '->', url)
    except Exception as e:
        print('FAIL', app_config.label, '->', repr(e))
